'use client';

import { useState } from 'react';
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
import { Loader2, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useTaskNotification } from '@/context/TaskNotificationContext';

export default function CaptainAccessCodePage() {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const { unlockAudio } = useTaskNotification();

  const staffRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff') : null, [firestore, user]);

  const handleNumpadClick = (value: string) => {
    if (accessCode.length < 6) {
      setAccessCode(accessCode + value);
    }
  };

  const handleDelete = () => {
    setAccessCode(accessCode.slice(0, -1));
  };

  const handleLogin = async () => {
    if (!staffRef || accessCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a 6-digit access code.',
      });
      return;
    }
    
    // Unlock audio on login click to enable notification sounds
    unlockAudio();
    setIsLoading(true);

    try {
      const staffQuery = query(staffRef, where('accessCode', '==', accessCode), limit(1));
      const staffSnapshot = await getDocs(staffQuery);

      if (!staffSnapshot.empty) {
        const staffDoc = staffSnapshot.docs[0];
        // Redirect to the new captain task page
        router.push(`/dashboard/captain/${staffDoc.id}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid Access Code. Please try again.',
        });
         setAccessCode('');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
            <Fingerprint className="mx-auto h-12 w-12 text-primary" />
           <CardTitle className="text-2xl mt-4">Captain Login</CardTitle>
           <CardDescription>Enter your 6-digit access code to manage service requests.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="space-y-2">
             <label htmlFor="access-code" className="text-sm font-medium">Access Code</label>
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
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button key={num} variant="outline" size="lg" className="h-16 text-2xl" onClick={() => handleNumpadClick(num.toString())} disabled={isLoading}>
                    {num}
                    </Button>
                ))}
                 <Button variant="outline" size="lg" className="h-16 text-2xl" onClick={handleDelete} disabled={isLoading}>
                    &larr;
                </Button>
                <Button variant="outline" size="lg" className="h-16 text-2xl" onClick={() => handleNumpadClick('0')} disabled={isLoading}>
                    0
                </Button>
               
            </div>
             <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || accessCode.length !== 6}>
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Login'}
            </Button>
         </CardContent>
       </Card>
    </div>
  );
}
