
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';

function AuthComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebase();
  const [message, setMessage] = useState('Completing your login, please wait...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!auth) {
        // This can happen briefly on first load before the provider is ready.
        setMessage('Initializing authentication service...');
        return;
    }

    if (!token) {
      setMessage('Login failed: Missing authorization token.');
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    const handleSignIn = async () => {
      try {
        await signInWithCustomToken(auth, token);
        setMessage('Login successful! Redirecting to your dashboard...');
        // Redirect to dashboard, the layout's auth guard will handle the rest.
        router.replace('/dashboard');

      } catch (error) {
        console.error('Error signing in with custom token:', error);
        setMessage('Authentication failed. Please try logging in again.');
        // Redirect to login page on failure
        setTimeout(() => router.replace('/login?error=token_fail'), 3000);
      }
    };

    handleSignIn();
  }, [searchParams, router, auth]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-2">
        <p className="text-xl font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">You will be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AuthComplete />
    </Suspense>
  );
}
