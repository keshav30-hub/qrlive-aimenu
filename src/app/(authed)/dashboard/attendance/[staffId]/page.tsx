
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';
import { doc, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { addMinutes, parse, isAfter } from 'date-fns';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';

type StaffMember = {
  id: string;
  name: string;
  shiftId?: string;
};

type Shift = {
    id: string;
    name: string;
    from: string;
    to: string;
};


export default function StaffAttendancePage() {
  const params = useParams();
  const { staffId } = params;
  const { toast } = useToast();
  const { uploadFile, isLoading: isUploading } = useFirebaseStorage();
  const { firestore, user } = useFirebase();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const staffDocRef = useMemoFirebase(() => (user && staffId) ? doc(firestore, 'users', user.uid, 'staff', staffId as string) : null, [firestore, user, staffId]);
  const { data: staffMember, isLoading: staffLoading } = useDoc<StaffMember>(staffDocRef);

  const shiftDocRef = useMemoFirebase(() => (user && staffMember?.shiftId) ? doc(firestore, 'users', user.uid, 'shifts', staffMember.shiftId) : null, [firestore, user, staffMember]);
  const { data: shift, isLoading: shiftLoading } = useDoc<Shift>(shiftDocRef);

  const isLoadingData = staffLoading || shiftLoading;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
      }
    };
    getCameraPermission();
  }, []);

  const handleMarkAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !staffMember || !shift) {
        toast({ variant: 'destructive', title: 'Error', description: 'Component not ready or staff data missing.' });
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
            const storagePath = `users/${user.uid}/attendance/${staffId}/${dateString}.jpg`;
            
            const uploadResult = await uploadFile(storagePath, blob as File);
            if (!uploadResult) {
                toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload attendance image.' });
                setIsProcessing(false);
                return;
            }

            const shiftStartTime = parse(shift.from, 'HH:mm', new Date());
            const graceTime = addMinutes(shiftStartTime, 15);
            let status = isAfter(currentDate, graceTime) ? 'Half Day' : 'Present';

            const attendanceRef = collection(firestore, 'users', user.uid, 'attendance');
            await addDoc(attendanceRef, {
                staffId: staffId,
                staffName: staffMember.name,
                shiftName: shift.name,
                captureTime: serverTimestamp(),
                imageUrl: uploadResult.downloadURL,
                status: status,
                date: dateString,
            });

            const staffRef = doc(firestore, 'users', user.uid, 'staff', staffId as string);
            await setDoc(staffRef, { status: status }, { merge: true });

            toast({ title: 'Success!', description: `You have been marked as ${status}.`});

        } catch (e: any) {
            console.error('Error marking attendance:', e);
            toast({ variant: 'destructive', title: 'Attendance Failed', description: e.message || 'An unexpected error occurred.' });
        } finally {
            setIsProcessing(false);
        }
    }, 'image/jpeg', 0.9);
  };

  if (isLoadingData) {
    return <div className="flex h-screen items-center justify-center">Loading staff details...</div>;
  }

  if (!staffMember) {
     return <div className="flex h-screen items-center justify-center">Could not verify staff details. Please go back and try again.</div>;
  }

  const staffName = staffMember?.name || 'Staff Member';
  const isDisabled = !hasCameraPermission || isProcessing || isUploading;

  return (
    <div className="flex items-center justify-center p-4">
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
