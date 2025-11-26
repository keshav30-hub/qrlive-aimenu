
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { addMinutes, parse, isAfter } from 'date-fns';

type Shift = {
    id: string;
    name: string;
    from: string;
    to: string;
};

type StaffMember = {
    id: string;
    shiftId: string;
};

export default function AttendancePage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { uploadFile, isLoading: isUploading } = useFirebaseStorage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleMarkAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Component not ready or user not logged in.' });
        return;
    }
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not get canvas context.' });
        setIsProcessing(false);
        return;
    }

    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    canvas.toBlob(async (blob) => {
        if (!blob) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to capture image.' });
            setIsProcessing(false);
            return;
        }

        try {
            const currentDate = new Date();
            const dateString = currentDate.toISOString().split('T')[0];
            const storagePath = `users/${user.uid}/attendance/${user.uid}/${dateString}.jpg`;
            
            const uploadResult = await uploadFile(storagePath, blob as File);
            if (!uploadResult) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload attendance image.' });
                setIsProcessing(false);
                return;
            }

            // Fetch staff and shift details
            const staffRef = doc(firestore, 'users', user.uid, 'staff', user.uid);
            const staffSnap = await getDoc(staffRef);

            if (!staffSnap.exists()) {
                throw new Error("Staff details not found.");
            }
            const staffData = staffSnap.data() as StaffMember;
            const shiftId = staffData.shiftId;
            if (!shiftId) {
                throw new Error("No shift assigned to this staff member.");
            }

            const shiftRef = doc(firestore, 'users', user.uid, 'shifts', shiftId);
            const shiftSnap = await getDoc(shiftRef);

            if (!shiftSnap.exists()) {
                throw new Error("Shift details not found.");
            }
            const shiftData = shiftSnap.data() as Shift;

            // Calculate attendance status
            const shiftStartTime = parse(shiftData.from, 'HH:mm', new Date());
            const graceTime = addMinutes(shiftStartTime, 15);
            
            let status = 'Absent';
            if (isAfter(currentDate, graceTime)) {
                status = 'Half Day';
            } else {
                status = 'Present';
            }

            // Save attendance record
            const attendanceRef = collection(firestore, 'users', user.uid, 'attendance');
            await addDoc(attendanceRef, {
                staffId: user.uid,
                staffName: user.displayName,
                shiftName: shiftData.name,
                captureTime: serverTimestamp(),
                imageUrl: uploadResult.downloadURL,
                status: status,
                date: dateString,
            });

            toast({ title: 'Success!', description: `You have been marked as ${status}.`});

        } catch (e: any) {
            console.error('Error marking attendance:', e);
            toast({ variant: 'destructive', title: 'Attendance Failed', description: e.message || 'An unexpected error occurred.' });
        } finally {
            setIsProcessing(false);
        }
    }, 'image/jpeg', 0.9);
  };

  const staffName = user?.displayName || 'Staff Member';
  const isDisabled = !hasCameraPermission || isProcessing || isUploading;

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
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {!hasCameraPermission && (
              <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser to use this feature.
                  </AlertDescription>
              </Alert>
          )}

          <Button size="lg" className="w-full h-12 text-lg" disabled={isDisabled} onClick={handleMarkAttendance}>
            {isProcessing || isUploading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Camera className="mr-2 h-6 w-6" />}
            {isProcessing ? 'Processing...' : isUploading ? 'Uploading...' : 'Capture Image'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
