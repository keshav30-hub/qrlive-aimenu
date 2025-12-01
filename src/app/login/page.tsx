
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
import { useEffect, useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

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
  
  const legalRef = useMemoFirebase(() => firestore ? collection(firestore, 'legal') : null, [firestore]);
  const legalQuery = useMemoFirebase(() => legalRef ? query(legalRef, orderBy('order')) : null, [legalRef]);
  const { data: legalDocs } = useCollection<LegalDoc>(legalQuery);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
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
        <CardContent>
          <Button
            variant="outline"
            className="w-full h-12 text-lg text-gray-700 bg-white border-gray-200 hover:bg-gray-50 shadow-md hover:shadow-lg transition-shadow"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle className="mr-4 h-6 w-6" />
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center items-center text-xs text-gray-500 gap-4">
            {legalDocs?.map(doc => (
                <Link key={doc.id} href={doc.url} target="_blank" className="hover:text-primary">
                    {doc.title}
                </Link>
            ))}
        </CardFooter>
      </Card>
    </div>
  );
}
