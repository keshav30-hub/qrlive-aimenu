'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Fingerprint, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

type UserProfile = {
  adminAccessCode?: string;
};

export default function StaffAccessCodePage() {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const userRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    // Check if access is already granted via session storage
    if (sessionStorage.getItem('staff_access_granted') === 'true') {
      router.replace('/dashboard/staff/manage');
    }
  }, [router]);

  const handleNumpadClick = (value: string) => {
    if (accessCode.length < 6) {
      setAccessCode(accessCode + value);
    }
  };

  const handleDelete = () => {
    setAccessCode(accessCode.slice(0, -1));
  };

  const handleLogin = async () => {
    if (accessCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a 6-digit access code.',
      });
      return;
    }
    setIsLoading(true);

    if (userProfile?.adminAccessCode === accessCode) {
      toast({
        title: 'Access Granted',
        description: 'Redirecting to staff management...',
      });
      sessionStorage.setItem('staff_access_granted', 'true');
      router.push('/dashboard/staff/manage');
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Invalid Access Code. Please try again.',
      });
      setAccessCode('');
    }

    setIsLoading(false);
  };
  
  if (isProfileLoading) {
      return <div className="flex h-screen items-center justify-center">Loading security settings...</div>;
  }

  if (!userProfile?.adminAccessCode) {
    return (
        <div className="flex items-center justify-center p-4">
            <Alert className="max-w-lg">
                <Settings className="h-4 w-4" />
                <AlertTitle>Admin Access Code Not Set</AlertTitle>
                <AlertDescription>
                To protect your staff's data, you must set up a 6-digit admin access code. Please go to the settings page to create one.
                </AlertDescription>
                <div className="mt-4">
                    <Link href="/dashboard/settings">
                        <Button>Go to Settings</Button>
                    </Link>
                </div>
            </Alert>
        </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Fingerprint className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl mt-4">Staff Area Access</CardTitle>
          <CardDescription>Enter your 6-digit admin access code to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="access-code" className="text-sm font-medium">
              Admin Access Code
            </label>
            <Input
              id="access-code"
              type="password"
              value={accessCode}
              readOnly
              className="text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="------"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                className={`h-16 text-2xl ${num === 0 ? 'col-start-2' : ''}`}
                onClick={() => handleNumpadClick(num.toString())}
                disabled={isLoading}
              >
                {num}
              </Button>
            ))}
             <Button variant="outline" size="lg" className="h-16 text-xl" onClick={handleDelete} disabled={isLoading}>
                &larr;
            </Button>
          </div>
          <Button
            className="w-full h-14 text-lg"
            onClick={handleLogin}
            disabled={isLoading || accessCode.length !== 6}
          >
            {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Enter'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
