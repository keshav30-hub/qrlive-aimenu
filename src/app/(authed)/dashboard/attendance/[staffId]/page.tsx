
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, CheckCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';
import { doc, addDoc, collection, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { addMinutes, parse, isAfter, format } from 'date-fns';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';

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

type AttendanceRecord = {
    id: string;
    status: 'Present' | 'Half Day' | 'Absent' | 'Paid Leave';
    captureTime: Timestamp;
};


export default function StaffAttendancePage() {
  const params = useParams();
  const router = useRouter();
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

  const todayDateString = format(new Date(), 'yyyy-MM-dd');
  const attendanceRef = useMemoFirebase(() => (user && staffId) ? collection(firestore, 'users', user.uid, 'staff', staffId as string, 'attendance') : null, [firestore, user, staffId]);
  
  const todaysAttendanceQuery = useMemoFirebase(
    () => attendanceRef ? query(attendanceRef, where('date', '==', todayDateString)) : null,
    [attendanceRef, todayDateString]
  );
  const { data: todaysAttendance, isLoading: attendanceLoading } = useCollection<AttendanceRecord>(todaysAttendanceQuery);

  const isLoadingData = staffLoading || shiftLoading || attendanceLoading;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if (todaysAttendance && todaysAttendance.length > 0) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

    // Cleanup function to stop the camera stream
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if(videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
         videoRef.current.srcObject = null;
      }
    };
  }, [todaysAttendance]);


  const handleMarkAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !user || !staffMember || !shift || !attendanceRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Component not ready, staff data, or shift data missing.' });
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

            await addDoc(attendanceRef, {
                staffId: staffId,
                staffName: staffMember.name,
                shiftName: shift.name,
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
  
  const handleLogout = () => {
    router.push('/dashboard/attendance');
  }

  if (isLoadingData) {
    return <div className="flex h-screen items-center justify-center">Verifying attendance status...</div>;
  }

  if (!staffMember) {
     return <div className="flex h-screen items-center justify-center">Could not verify staff details. Please go back and try again.</div>;
  }
  
  if (!shift) {
       return <div className="flex h-screen items-center justify-center p-4">
           <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Shift Not Assigned</AlertTitle>
                <AlertDescription>
                    This staff member has not been assigned a shift. Please go to the Staff Management page and assign a shift to continue.
                </AlertDescription>
           </Alert>
       </div>;
  }

  const staffName = staffMember?.name || 'Staff Member';
  const isDisabled = !hasCameraPermission || isProcessing || isUploading || !shift;
  
  const existingAttendance = todaysAttendance?.[0];

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Welcome, {staffName}</CardTitle>
           {existingAttendance && <CardDescription className="text-center pt-2">Here is your attendance status for today.</CardDescription>}
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

        {existingAttendance ? (
            <Card className="bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                <CardContent className="pt-6 text-center space-y-3">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <h3 className="text-2xl font-semibold">Attendance Marked!</h3>
                    <p>
                        Your attendance for today has been marked as{' '}
                        <span className="font-bold">{existingAttendance.status}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Captured at: {existingAttendance.captureTime.toDate().toLocaleTimeString()}
                    </p>
                </CardContent>
                 <CardFooter>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </CardFooter>
            </Card>
        ) : (
          <>
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
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
