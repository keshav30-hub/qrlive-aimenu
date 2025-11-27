'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Clock, FilePenLine, Trash2, MoreVertical, AlarmClock, Loader2, Image as ImageIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type AttendanceRecord = {
    id: string;
    staffId: string;
    staffName: string;
    status: 'Present' | 'Absent' | 'Half Day' | 'Paid Leave';
    date: string;
    imageUrl?: string;
    captureTime?: Timestamp;
};

type StaffMember = {
  id: string;
  name: string;
  avatar: string;
  active: boolean;
  accessCode?: string;
  shiftId?: string;
  monthlySalary?: number;
};

type Shift = {
    id: string;
    name: string;
    from: string;
    to: string;
};

const pageAccessOptions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'menu', label: 'Menu' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'qr-menu', label: 'QR Menu' },
    { id: 'events', label: 'Events' },
    { id: 'staff', label: 'Staff' },
    { id: 'settings', label: 'Settings' },
];

const getStatusVariant = (status: AttendanceRecord['status']) => {
  switch (status) {
    case 'Present':
      return 'default';
    case 'Absent':
      return 'destructive';
    case 'Half Day':
    case 'Paid Leave':
      return 'secondary';
    default:
      return 'outline';
  }
};

const StaffAttendanceRow = ({ staff, date }: { staff: StaffMember, date: Date }) => {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();

    const dateString = format(date, 'yyyy-MM-dd');

    const attendanceRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'attendance') : null, [user, firestore]);
    const attendanceQuery = useMemoFirebase(
      () => attendanceRef ? query(attendanceRef, where('staffId', '==', staff.id), where('date', '==', dateString), limit(1)) : null,
      [attendanceRef, staff.id, dateString]
    );
    const { data: attendanceData, isLoading } = useCollection<AttendanceRecord>(attendanceQuery);

    const record = attendanceData?.[0];
    const status = record?.status || 'Absent';

    const handleStatusChange = async (newStatus: AttendanceRecord['status']) => {
        if (!attendanceRef) return;
        
        try {
            if (record) {
                 const recordRef = doc(attendanceRef, record.id);
                 await updateDoc(recordRef, { status: newStatus });
            } else {
                await addDoc(attendanceRef, {
                    staffId: staff.id,
                    staffName: staff.name,
                    date: dateString,
                    status: newStatus,
                    captureTime: serverTimestamp(),
                });
            }
            toast({ title: 'Status Updated', description: `Marked ${staff.name} as ${newStatus}.`});
        } catch(e) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
          console.error(e);
        }
      };


    return (
        <React.Fragment>
            <TableRow>
            <TableCell>
                <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={staff.avatar} alt={staff.name} />
                    <AvatarFallback>
                    {staff.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium">{staff.name}</span>
                </div>

            </TableCell>
            <TableCell className="text-right">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 ml-auto" /> : (
                    <div className="flex gap-2 justify-end">
                        {(['Present', 'Absent', 'Half Day', 'Paid Leave'] as const).map((s) => (
                            <Badge
                            key={s}
                            variant={status === s ? getStatusVariant(s) : 'outline'}
                            onClick={() => handleStatusChange(s)}
                            className={cn(
                                "cursor-pointer capitalize w-24 justify-center",
                                status !== s && "bg-transparent text-foreground"
                            )}
                            >
                            {s}
                            </Badge>
                        ))}
                    </div>
                )}
            </TableCell>
            </TableRow>
             {record?.imageUrl && (
                <TableRow>
                    <TableCell colSpan={2} className="py-2 px-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden cursor-pointer">
                                        <Image src={record.imageUrl} alt={`Attendance for ${staff.name}`} layout="fill" objectFit="cover" />
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Attendance for {staff.name}</DialogTitle>
                                        <DialogDescription>{record.captureTime?.toDate().toLocaleString()}</DialogDescription>
                                    </DialogHeader>
                                     <div className="relative mt-4 h-96 w-full">
                                        <Image src={record.imageUrl} alt={`Attendance for ${staff.name}`} layout="fill" objectFit="contain" />
                                     </div>
                                </DialogContent>
                            </Dialog>
                            <div>
                                <p className="text-xs text-muted-foreground">Captured at:</p>
                                <p className="text-sm font-medium">{record.captureTime?.toDate().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    )
}

export default function StaffPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const staffRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff') : null, [firestore, user]);
  const shiftsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'shifts') : null, [firestore, user]);
  
  const [date, setDate] = useState<Date>(new Date());
    
  const { data: adminUser } = useDoc<{ adminAccessCode?: string }>(userRef);
  const { data: staffListData, isLoading: staffLoading } = useCollection<StaffMember>(staffRef);
  const { data: shiftsData, isLoading: shiftsLoading } = useCollection<Shift>(shiftsRef);
  
  const staffList = staffListData || [];
  const shifts = shiftsData || [];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dob, setDob] = useState<Date>();
  const [reminderTime, setReminderTime] = useState<string | null>('10:00');
  const [newReminderTime, setNewReminderTime] = useState<string>('10:00');
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftFrom, setNewShiftFrom] = useState('');
  const [newShiftTo, setNewShiftTo] = useState('');
  const [isSavingShift, setIsSavingShift] = useState(false);

  // State for staff form
  const [newStaff, setNewStaff] = useState<Partial<StaffMember>>({});
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);

  const handlePrevDay = () => {
    setDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setDate(prev => subDays(prev, -1));
  };

  const handleSaveReminder = () => {
    setReminderTime(newReminderTime);
    setIsEditingReminder(false);
  };

  const handleDeleteReminder = () => {
    setReminderTime(null);
    setIsEditingReminder(false);
  };

  const activeStaffList = staffList.filter(staff => staff.active);

  const handleSaveShift = async () => {
    if (!newShiftName || !newShiftFrom || !newShiftTo || !shiftsRef) return;
    setIsSavingShift(true);
    try {
        await addDoc(shiftsRef, {
            name: newShiftName,
            from: newShiftFrom,
            to: newShiftTo,
        });
        toast({ title: 'Success', description: 'New shift has been added.' });
        setNewShiftName('');
        setNewShiftFrom('');
        setNewShiftTo('');
        setIsShiftDialogOpen(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save shift.' });
        console.error(e);
    } finally {
        setIsSavingShift(false);
    }
  };

  const isAccessCodeUnique = async (code: string, currentStaffId?: string) => {
      if (!staffRef) return false;
      
      if (adminUser?.adminAccessCode === code) return false;

      const q = query(staffRef, where("accessCode", "==", code));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return true;

      if (currentStaffId && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === currentStaffId) {
          return true;
      }
      
      return false;
  };

  const handleSaveStaff = async () => {
    if (!staffRef) return;
    if (!newStaff.name) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Staff name is required.' });
        return;
    }
    if (!newStaff.monthlySalary) {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Monthly salary is required.' });
        return;
    }

    if (newStaff.accessCode) {
        if (!/^\d{6}$/.test(newStaff.accessCode)) {
            setAccessCodeError("Access code must be a 6-digit number.");
            return;
        }
        const isUnique = await isAccessCodeUnique(newStaff.accessCode, newStaff.id);
        if (!isUnique) {
            setAccessCodeError("This access code is already in use.");
            return;
        }
    }
    setAccessCodeError(null);
    
    setIsSavingStaff(true);

    const dataToSave: Omit<Partial<StaffMember>, 'id'> = {
        name: newStaff.name,
        accessCode: newStaff.accessCode || '',
        shiftId: newStaff.shiftId || '',
        monthlySalary: newStaff.monthlySalary,
        active: newStaff.id ? newStaff.active : true, // Default to active for new staff
        avatar: newStaff.avatar || `https://i.pravatar.cc/150?u=${Date.now()}`
    };

    try {
      if (newStaff.id) { // Editing existing staff
        const staffDoc = doc(staffRef, newStaff.id);
        await updateDoc(staffDoc, dataToSave);
        toast({ title: 'Success', description: 'Staff member updated.'});
      } else { // Adding new staff
        await addDoc(staffRef, dataToSave);
        toast({ title: 'Success', description: 'Staff member added.'});
      }
      setIsSheetOpen(false);
      setNewStaff({});
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save staff member.' });
      console.error(e);
    } finally {
      setIsSavingStaff(false);
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <div className="flex gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                    <AlarmClock className="mr-2 h-4 w-4" />
                    Attendance Reminder
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Attendance Reminder</DialogTitle>
                    <DialogDescription>
                        Set, edit, or delete your daily attendance reminder.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                    {reminderTime && !isEditingReminder ? (
                        <div className="space-y-4">
                            <Label>Current Reminder</Label>
                            <div className="flex items-center justify-between rounded-md border p-3">
                                <p className="text-lg font-semibold">{format(new Date(`1970-01-01T${reminderTime}`), 'hh:mm a')}</p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if(reminderTime) setNewReminderTime(reminderTime); setIsEditingReminder(true); }}>
                                        <FilePenLine className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDeleteReminder}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="reminder-time">{isEditingReminder ? 'Edit Reminder Time' : 'Set Reminder Time'}</Label>
                            <Input 
                                id="reminder-time" 
                                type="time"
                                value={newReminderTime}
                                onChange={(e) => setNewReminderTime(e.target.value)}
                            />
                        </div>
                    )}
                    </div>
                    <DialogFooter>
                        {isEditingReminder || !reminderTime ? (
                            <>
                                {isEditingReminder && <Button variant="ghost" onClick={() => setIsEditingReminder(false)}>Cancel</Button>}
                                <Button onClick={handleSaveReminder}>Save</Button>
                            </>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Manage Shifts
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Manage Shifts</DialogTitle>
                <DialogDescription>
                    View, create, and edit staff shifts.
                </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Existing Shifts</Label>
                        <div className="space-y-2">
                            {shiftsLoading ? <p>Loading shifts...</p> : shifts.map(shift => (
                                <div key={shift.id} className="flex items-center justify-between rounded-md border p-3">
                                    <div>
                                        <p className="font-semibold">{shift.name}</p>
                                        <p className="text-sm text-muted-foreground">{shift.from} - {shift.to}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <FilePenLine className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                    <div>
                        <Label htmlFor="shift-name" className="text-sm font-medium text-muted-foreground">Add New Shift</Label>
                    </div>
                        <div className="space-y-2">
                            <Label htmlFor="shift-name">Shift Name</Label>
                            <Input id="shift-name" placeholder="e.g. Lunch Shift" value={newShiftName} onChange={(e) => setNewShiftName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-time">From</Label>
                                <Input id="from-time" type="time" value={newShiftFrom} onChange={(e) => setNewShiftFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-time">To</Label>
                                <Input id="to-time" type="time" value={newShiftTo} onChange={(e) => setNewShiftTo(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveShift} disabled={isSavingShift || !newShiftName || !newShiftFrom || !newShiftTo}>
                        {isSavingShift ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Shift
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Attendance</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(day) => day && setDate(day)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 <Button variant="outline" size="icon" onClick={handleNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffLoading ? <p>Loading staff...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStaffList.map((staff) => (
                    <StaffAttendanceRow key={staff.id} staff={staff} date={date} />
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="staff">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Staff</CardTitle>
                <CardDescription>Manage your staff members here.</CardDescription>
              </div>
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button onClick={() => { setNewStaff({}); setIsSheetOpen(true); }}>
                    <PlusCircle className="mr-2" />
                    Add Staff
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                   <SheetHeader>
                    <SheetTitle>{newStaff.id ? 'Edit Staff Member' : 'Add New Staff Member'}</SheetTitle>
                    <SheetDescription>
                      Fill in the details below to manage a team member.
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100%-120px)] pr-4">
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="staff-image">Staff Image</Label>
                            <Input id="staff-image" type="file" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input id="full-name" placeholder="e.g. John Doe" value={newStaff.name || ''} onChange={(e) => setNewStaff(p => ({...p, name: e.target.value}))}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="access-code">Access Code (6-digits)</Label>
                             <Input id="access-code" placeholder="e.g. 123456" maxLength={6} value={newStaff.accessCode || ''} onChange={(e) => {
                                 setAccessCodeError(null);
                                 if (/^\d*$/.test(e.target.value)) {
                                     setNewStaff(p => ({...p, accessCode: e.target.value}));
                                 }
                             }} />
                             {accessCodeError && <p className="text-sm text-destructive">{accessCodeError}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dob && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dob}
                                    onSelect={setDob}
                                    captionLayout="dropdown-buttons"
                                    fromYear={1960}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="full-address">Full Address</Label>
                            <Textarea id="full-address" placeholder="Enter full address" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="staff-salary">Monthly Salary</Label>
                            <Input id="staff-salary" type="number" placeholder="e.g. 30000" value={newStaff.monthlySalary || ''} onChange={(e) => setNewStaff(p => ({...p, monthlySalary: Number(e.target.value)}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shift-selection">Shift Selection</Label>
                             <Select value={newStaff.shiftId} onValueChange={value => setNewStaff(p => ({ ...p, shiftId: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shifts.map(shift => (
                                      <SelectItem key={shift.id} value={shift.id}>{shift.name} ({shift.from} - {shift.to})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label>Page Access</Label>
                            <div className="space-y-2 rounded-md border p-4">
                                {pageAccessOptions.map((item) => (
                                    <div key={item.id} className="flex flex-row items-center space-x-3">
                                        <Checkbox id={`access-${item.id}`} />
                                        <Label htmlFor={`access-${item.id}`} className="font-normal">
                                            {item.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </ScrollArea>
                   <SheetFooter>
                    <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveStaff} disabled={isSavingStaff}>
                        {isSavingStaff ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isSavingStaff ? "Saving..." : "Save Staff"}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffLoading ? <p>Loading...</p> : staffList.map((staff) => (
                  <Link key={staff.id} href={`/dashboard/staff/${staff.id}`} className="block">
                    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
                        <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-3 flex-grow">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={staff.avatar} alt={staff.name} />
                                <AvatarFallback>
                                {staff.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className='space-y-1'>
                                <CardTitle className="text-xl">{staff.name}</CardTitle>
                                {staff.accessCode && <p className="text-xs text-muted-foreground font-mono">Code: {staff.accessCode}</p>}
                            </div>
                        </CardContent>
                         <CardFooter className="flex justify-end p-2 bg-gray-50 dark:bg-gray-800/50 mt-auto">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.preventDefault()}>
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">More options</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setNewStaff(staff); setIsSheetOpen(true); }}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                  </Link>
                ))}
                {staffList.length === 0 && !staffLoading && (
                  <div className="col-span-full text-center py-10 text-muted-foreground">
                    <p>No staff members have been added yet.</p>
                  </div>
                )}
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
