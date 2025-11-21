
'use client';

import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

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
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to QRLive Menu</CardTitle>
          <CardDescription>
            Sign in to manage your restaurant's digital presence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            className="w-full h-12 text-lg"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle className="mr-4 h-6 w-6" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
