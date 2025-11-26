
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useFirebase } from '@/firebase';

export default function AttendancePage() {
  const { user } = useFirebase();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const staffName = user?.displayName || 'Staff Member';

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Welcome, {staffName}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-lg text-muted-foreground">
            {currentTime.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <Button size="lg" className="w-full h-12 text-lg">
            <Camera className="mr-2 h-6 w-6" />
            Capture Image
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
