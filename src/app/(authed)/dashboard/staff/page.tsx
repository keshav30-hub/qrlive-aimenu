
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Clock, FilePenLine, Trash2, MoreVertical, AlarmClock } from 'lucide-react';
import { format } from 'date-fns';
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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'Present' | 'Absent' | 'Paid Leave' | 'Half Day';

type StaffMember = {
  id: string;
  name: string;
  avatar: string;
  status: AttendanceStatus;
  active: boolean;
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

const attendanceOptions: AttendanceStatus[] = ['Present', 'Absent', 'Paid Leave', 'Half Day'];

const getStatusVariant = (status: AttendanceStatus) => {
  switch (status) {
    case 'Present':
      return 'default';
    case 'Absent':
      return 'destructive';
    case 'Paid Leave':
      return 'secondary';
    case 'Half Day':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function StaffPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const staffRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'staff') : null, [firestore, user]);
  const shiftsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'shifts') : null, [firestore, user]);

  const { data: staffListData, isLoading: staffLoading } = useCollection<StaffMember>(staffRef);
  const { data: shiftsData, isLoading: shiftsLoading } = useCollection<Shift>(shiftsRef);
  
  const staffList = staffListData || [];
  const shifts = shiftsData || [];

  const [date, setDate] = useState<Date>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [dob, setDob] = useState<Date>();
  const [reminderTime, setReminderTime] = useState<string | null>('10:00');
  const [newReminderTime, setNewReminderTime] = useState<string>('10:00');
  const [isEditingReminder, setIsEditingReminder] = useState(false);

  const handleStatusChange = async (staffId: string, newStatus: AttendanceStatus) => {
    if (!staffRef) return;
    try {
      const staffDoc = doc(staffRef, staffId);
      // This is a simplified attendance update. A real app would use a subcollection for attendance records.
      await updateDoc(staffDoc, { status: newStatus });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
      console.error(e);
    }
  };
  
  const handlePrevDay = () => {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    setDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    setDate(nextDay);
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
            <Dialog>
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
                            <Input id="shift-name" placeholder="e.g. Lunch Shift" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-time">From</Label>
                                <Input id="from-time" type="time" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-time">To</Label>
                                <Input id="to-time" type="time" />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                <Button type="submit">Save Shift</Button>
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
                    <TableRow key={staff.id}>
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
                        <div className="flex gap-2 justify-end">
                            {attendanceOptions.map((status) => (
                                <Badge
                                key={status}
                                variant={staff.status === status ? getStatusVariant(status) : 'outline'}
                                onClick={() => handleStatusChange(staff.id, status)}
                                className={cn(
                                    "cursor-pointer capitalize w-24 justify-center",
                                    staff.status !== status && "bg-transparent text-foreground"
                                )}
                                >
                                {status}
                                </Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
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
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Staff
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                   <SheetHeader>
                    <SheetTitle>Add New Staff Member</SheetTitle>
                    <SheetDescription>
                      Fill in the details below to add a new team member.
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
                            <Input id="full-name" placeholder="e.g. John Doe" />
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
                          <Label htmlFor="staff-salary">Staff Salary</Label>
                          <Input id="staff-salary" type="number" placeholder="e.g. 30000" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shift-selection">Shift Selection</Label>
                             <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shifts.map(shift => (
                                      <SelectItem key={shift.id} value={shift.name.toLowerCase().replace(' ', '-')}>{shift.name}</SelectItem>
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
                    <Button>Save Staff</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffLoading ? <p>Loading...</p> : staffList.map((staff) => (
                    <Card key={staff.id} className="overflow-hidden">
                        <Link href={`/dashboard/staff/${staff.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-3">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={staff.avatar} alt={staff.name} />
                                    <AvatarFallback>
                                    {staff.name.split(' ').map((n) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='space-y-1'>
                                    <CardTitle className="text-xl">{staff.name}</CardTitle>
                                </div>
                            </CardContent>
                        </Link>
                         <CardFooter className="flex justify-end p-2 bg-gray-50 dark:bg-gray-800/50">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                    <span className="sr-only">More options</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
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
