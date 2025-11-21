'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from '@/components/ui/badge';
import { placeHolderImages } from '@/lib/placeholder-images';
import { User, Calendar, Clock, Info, Users, PlusCircle, FilePenLine, Trash2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const eventDetails = {
  id: '1',
  name: 'Jazz Night',
  description: 'Enjoy a relaxing evening with live jazz music featuring some of the best local artists. The night will be filled with smooth melodies and a great atmosphere. Perfect for a date night or a night out with friends. Full bar and a special cocktail menu will be available.',
  datetime: '2023-11-15 19:00',
  imageUrl: placeHolderImages.find((p) => p.id === 'event1')?.imageUrl || '',
  imageHint: placeHolderImages.find((p) => p.id === 'event1')?.imageHint || '',
  organizers: ['The Velvet Note Club', 'City Jazz Association'],
};

const initialRsvpList = [
  {
    seq: 1,
    name: 'Alice Johnson',
    mobile: '555-0101',
    email: 'alice@example.com',
    people: 2,
    status: 'Attended',
  },
  {
    seq: 2,
    name: 'Bob Williams',
    mobile: '555-0102',
    email: 'bob@example.com',
    people: 1,
    status: 'Interested',
  },
  {
    seq: 3,
    name: 'Charlie Brown',
    mobile: '555-0103',
    email: 'charlie@example.com',
    people: 4,
    status: 'Attended',
  },
  {
    seq: 4,
    name: 'Diana Prince',
    mobile: '555-0104',
    email: 'diana@example.com',
    people: 2,
    status: 'No Show',
  },
    {
    seq: 5,
    name: 'Ethan Hunt',
    mobile: '555-0105',
    email: 'ethan@example.com',
    people: 3,
    status: 'Attended',
  },
   {
    seq: 6,
    name: 'Fiona Glenanne',
    mobile: '555-0106',
    email: 'fiona@example.com',
    people: 1,
    status: 'Attended',
  },
];

const statusOptions = ['Attended', 'Interested', 'No Show'];

const statusVariant = (status: string) => {
  switch (status) {
    case 'Attended':
      return 'default';
    case 'No Show':
      return 'destructive';
    case 'Interested':
      return 'secondary';
    default:
      return 'outline';
  }
};


export default function EventDetailsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const date = new Date(eventDetails.datetime);
  const [rsvpList, setRsvpList] = useState(initialRsvpList);

  const handleStatusChange = (seq: number, newStatus: string) => {
    setRsvpList(rsvpList.map(rsvp => rsvp.seq === seq ? { ...rsvp, status: newStatus } : rsvp));
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text("RSVP Details", 14, 16);
    (doc as any).autoTable({
      startY: 20,
      head: [['#', 'Name', 'Mobile Number', 'No. of People']],
      body: rsvpList.map(rsvp => [rsvp.seq, rsvp.name, rsvp.mobile, rsvp.people]),
    });
    doc.save('rsvp-details.pdf');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Event Details</h1>
      
      <Card className="overflow-hidden">
        <div className="relative w-full h-64 md:h-80">
          <Image
            src={eventDetails.imageUrl}
            alt={eventDetails.name}
            fill
            style={{objectFit: 'cover'}}
            data-ai-hint={eventDetails.imageHint}
          />
        </div>
        <CardHeader>
           <div className="flex justify-between items-center">
            <CardTitle className="text-4xl">{eventDetails.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <FilePenLine className="h-5 w-5" />
                <span className="sr-only">Edit Event</span>
              </Button>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-5 w-5" />
                 <span className="sr-only">Delete Event</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className='flex items-center gap-2'>
              <Calendar className="h-5 w-5" />
              <span>{date.toLocaleDateString()}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className="h-5 w-5" />
              <span>{date.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-foreground/80">
            <Info className="h-5 w-5 mt-1 shrink-0" />
            <p>{eventDetails.description}</p>
          </div>
          {eventDetails.organizers && eventDetails.organizers.length > 0 && (
             <div className="flex items-start gap-2 text-foreground/80">
                <Users className="h-5 w-5 mt-1 shrink-0" />
                <div>
                    <h3 className="font-semibold">Organized by:</h3>
                    <p>{eventDetails.organizers.join(', ')}</p>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>RSVP Details</CardTitle>
            <CardDescription>
              Here are the details of guests who have RSVP'd to the event.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="mr-2" />
                Download PDF
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2" />
                  Add RSVP
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New RSVP</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new RSVP.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" placeholder="Guest Name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile" className="text-right">
                      Mobile
                    </Label>
                    <Input id="mobile" placeholder="Mobile Number" type="tel" pattern="[0-9]{10}" maxLength={10} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email (Optional)
                    </Label>
                    <Input id="email" type="email" placeholder="Email Address" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="people" className="text-right">
                      No. of People
                    </Label>
                    <Input id="people" type="number" placeholder="1" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save RSVP</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>No. of People</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsvpList.map((rsvp) => (
                <TableRow key={rsvp.seq}>
                  <TableCell>{rsvp.seq}</TableCell>
                  <TableCell>{rsvp.name}</TableCell>
                  <TableCell>{rsvp.mobile}</TableCell>
                  <TableCell className="text-center">{rsvp.people}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="capitalize w-28 justify-start">
                          <Badge variant={statusVariant(rsvp.status)} className="w-full">
                            {rsvp.status}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {statusOptions.map(status => (
                          <DropdownMenuItem key={status} onSelect={() => handleStatusChange(rsvp.seq, status)}>
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
    </div>
  );
}
