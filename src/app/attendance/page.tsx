
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { getStaffByAccessCode } from '@/lib/qrmenu';

export default function AccessCodePage() {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [businessId, setBusinessId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const idFromQuery = searchParams.get('businessId');
    if (idFromQuery) {
      setBusinessId(idFromQuery);
    }
  }, [searchParams]);

  const handleNumpadClick = (value: string) => {
    if (accessCode.length < 6) {
      setAccessCode(accessCode + value);
    }
  };

  const handleDelete = () => {
    setAccessCode(accessCode.slice(0, -1));
  };

  const handleLogin = async () => {
    if (!businessId.trim() || accessCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a valid Business ID and a 6-digit access code.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const { staffMember, userId } = await getStaffByAccessCode(businessId, accessCode);
      
      if (staffMember && userId) {
        // Store staffId in sessionStorage for the attendance page to use
        sessionStorage.setItem('attendanceStaffId', staffMember.id);
        sessionStorage.setItem('attendanceUserId', userId);
        router.push(`/attendance/${businessId}/${staffMember.id}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid Business ID or Access Code. Please try again.',
        });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
            <Fingerprint className="mx-auto h-12 w-12 text-primary" />
           <CardTitle className="text-2xl mt-4">Staff Attendance Login</CardTitle>
           <CardDescription>Enter your 6-digit access code to continue.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           { !searchParams.get('businessId') &&
             <div className="space-y-2">
                <label htmlFor="business-id" className="text-sm font-medium">Business ID</label>
                <Input 
                    id="business-id"
                    placeholder="Enter your Business ID"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    disabled={isLoading}
                />
           </div>
           }
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
             <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || accessCode.length !== 6 || !businessId.trim()}>
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Login'}
            </Button>
         </CardContent>
       </Card>
    </div>
  );
}
