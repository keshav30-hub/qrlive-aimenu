
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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      toast({
        title: 'Sign In Successful',
        description: `Welcome back, ${user.displayName}!`,
      });
      router.push('/'); // Redirect to the root, which will handle onboarding check
    } else {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to QRLive Menu</CardTitle>
          <CardDescription>
            Sign in to manage your restaurant's digital presence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
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

    