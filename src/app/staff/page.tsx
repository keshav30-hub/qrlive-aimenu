'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


type AttendanceStatus = 'Present' | 'Absent' | 'Paid Leave' | 'Half Day';

const initialStaffList = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    status: 'Present' as AttendanceStatus,
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    status: 'Absent' as AttendanceStatus,
  },
  {
    id: '3',
    name: 'Alex Johnson',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    status: 'Paid Leave' as AttendanceStatus,
  },
  {
    id: '4',
    name: 'Emily White',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d',
    status: 'Half Day' as AttendanceStatus,
  },
  {
    id: '5',
    name: 'Michael Brown',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d',
    status: 'Present' as AttendanceStatus,
  },
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
  const [staffList, setStaffList] = useState(initialStaffList);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleStatusChange = (staffId: string, newStatus: AttendanceStatus) => {
    setStaffList(
      staffList.map((staff) =>
        staff.id === staffId ? { ...staff, status: newStatus } : staff
      )
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Management</h1>
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Attendance</CardTitle>
              <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="capitalize w-32 justify-start"
                            >
                              <Badge
                                variant={getStatusVariant(staff.status)}
                                className="w-full"
                              >
                                {staff.status}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {attendanceOptions.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onSelect={() =>
                                  handleStatusChange(staff.id, status)
                                }
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="staff">
           <Card>
            <CardHeader>
              <CardTitle>All Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Staff details will be displayed here.</p>
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
