
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AttendancePage() {
  const { user } = useFirebase();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API is not supported by this browser.');
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => clearInterval(timer);
  }, [toast]);

  const staffName = user?.displayName || 'Staff Member';

  return (
    <div className="flex items-center justify-center min-h-full">
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

          <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          </div>
          
          {!hasCameraPermission && (
              <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser to use this feature.
                  </AlertDescription>
              </Alert>
          )}

          <Button size="lg" className="w-full h-12 text-lg" disabled={!hasCameraPermission}>
            <Camera className="mr-2 h-6 w-6" />
            Capture Image
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
