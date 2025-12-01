
'use client';

import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type LegalDoc = {
    id: string;
    title: string;
    url: string;
    order: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  const legalRef = useMemoFirebase(() => firestore ? collection(firestore, 'legal') : null, [firestore]);
  const legalQuery = useMemoFirebase(() => legalRef ? query(legalRef, orderBy('order')) : null, [legalRef]);
  const { data: legalDocs, isLoading: legalDocsLoading } = useCollection<LegalDoc>(legalQuery);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!termsAccepted) {
      toast({
        variant: 'destructive',
        title: 'Agreement Required',
        description: 'You must agree to the terms and conditions to continue.',
      });
      return;
    }
    const signedInUser = await signInWithGoogle();
    if (signedInUser) {
      toast({
        title: 'Sign In Successful',
        description: `Welcome, ${signedInUser.displayName}!`,
      });
      // The auth redirect in the layout will handle the push to onboarding or dashboard
      router.push('/'); 
    } else {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    }
  };
  
  // Render loading state or nothing if user check is in progress
  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md bg-white text-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">Welcome to QRLive Menu</CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to manage your restaurant's digital presence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-12 text-lg text-gray-700 bg-white border-gray-200 hover:bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
            onClick={handleGoogleSignIn}
            disabled={!termsAccepted || legalDocsLoading}
          >
            <FcGoogle className="mr-4 h-6 w-6" />
            Sign in with Google
          </Button>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(!!checked)} />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept terms and conditions
              </label>
              <p className="text-sm text-muted-foreground">
                By creating an account, you agree to our&nbsp;
                 {legalDocs && legalDocs.map((doc, index) => (
                    <React.Fragment key={doc.id}>
                        <Link href={doc.url} target="_blank" className="underline hover:text-primary">
                            {doc.title}
                        </Link>
                        {index < legalDocs.length - 2 ? ', ' : (index === legalDocs.length - 2 ? ' & ' : '')}
                    </React.Fragment>
                ))}
                .
              </p>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-center items-center text-xs text-gray-500 gap-4">
            {legalDocs?.map(doc => (
                <Link key={doc.id} href={doc.url} target="_blank" className="hover:text-primary hidden">
                    {doc.title}
                </Link>
            ))}
        </CardFooter>
      </Card>
    </div>
  );
}
