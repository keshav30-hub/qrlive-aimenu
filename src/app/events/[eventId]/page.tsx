'use client';

import Image from 'next/image';
import Link from 'next/link';
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
import { User, Calendar, Clock, Info, Users, PlusCircle, FilePenLine, Trash2, Download, ChevronLeft, Check, X } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from '@/components/ui/textarea';


const eventDetailsData = {
  id: '1',
  name: 'Jazz Night',
  description: 'Enjoy a relaxing evening with live jazz music featuring some of the best local artists. The night will be filled with smooth melodies and a great atmosphere. Perfect for a date night or a night out with friends. Full bar and a special cocktail menu will be available.',
  datetime: '2023-11-15T19:00',
  imageUrl: placeHolderImages.find((p) => p.id === 'event1')?.imageUrl || '',
  imageHint: placeHolderImages.find((p) => p.id === 'event1')?.imageHint || '',
  organizers: ['The Velvet Note Club', 'City Jazz Association'],
};

const initialRsvpList = Array.from({ length: 25 }, (_, i) => {
  const statusTypes = ['Attended', 'Interested', 'No Show'] as const;
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Prince', 'Hunt', 'Glenanne', 'Costanza', 'Benes', 'Malcolm', 'Roberts'];
  const status = statusTypes[i % statusTypes.length];
  return {
    seq: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    mobile: `555-01${(i + 1).toString().padStart(2, '0')}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}@example.com`,
    people: (i % 4) + 1,
    status: status,
  }
});


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

const ITEMS_PER_PAGE = 15;


export default function EventDetailsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [eventDetails, setEventDetails] = useState(eventDetailsData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(eventDetailsData);
  
  const [rsvpList, setRsvpList] = useState(initialRsvpList);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rsvpList.length / ITEMS_PER_PAGE);

  const paginatedRsvpList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return rsvpList.slice(startIndex, endIndex);
  }, [currentPage, rsvpList]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


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

  const handleEditClick = () => {
    setEditedDetails(eventDetails);
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    setEventDetails(editedDetails);
    setIsEditing(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const currentDateTime = new Date(editedDetails.datetime);
    
    if (name === 'date') {
      const [year, month, day] = value.split('-').map(Number);
      currentDateTime.setFullYear(year, month - 1, day);
    } else if (name === 'time') {
      const [hours, minutes] = value.split(':').map(Number);
      currentDateTime.setHours(hours, minutes);
    }

    setEditedDetails(prev => ({ ...prev, datetime: currentDateTime.toISOString() }));
  };
  

  const date = new Date(eventDetails.datetime);
  const editedDate = new Date(editedDetails.datetime);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events">
           <Button size="icon" className="bg-primary text-primary-foreground">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Events</span>
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Event Details</h1>
      </div>
      
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
            {isEditing ? (
              <Input
                name="name"
                value={editedDetails.name}
                onChange={handleInputChange}
                className="text-4xl font-bold p-0 border-0 shadow-none focus-visible:ring-0"
              />
            ) : (
              <CardTitle className="text-4xl">{eventDetails.name}</CardTitle>
            )}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelClick}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveClick}>
                    <Check className="mr-2 h-4 w-4" /> Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="icon" onClick={handleEditClick}>
                    <FilePenLine className="h-5 w-5" />
                    <span className="sr-only">Edit Event</span>
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-5 w-5" />
                     <span className="sr-only">Delete Event</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className='flex items-center gap-2'>
              <Calendar className="h-5 w-5" />
               {isEditing ? (
                <div className="flex gap-2">
                  <Input 
                    type="date"
                    name="date" 
                    value={editedDate.toISOString().split('T')[0]}
                    onChange={handleDateChange} 
                  />
                  <Input 
                    type="time" 
                    name="time"
                    value={editedDate.toTimeString().slice(0, 5)}
                    onChange={handleDateChange} 
                  />
                </div>
              ) : (
                <>
                  <span>{date.toLocaleDateString()}</span>
                  <Clock className="h-5 w-5" />
                  <span>{date.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 text-foreground/80">
            <Info className="h-5 w-5 mt-1 shrink-0" />
            {isEditing ? (
              <Textarea 
                name="description" 
                value={editedDetails.description} 
                onChange={handleInputChange} 
                className="w-full"
              />
            ) : (
              <p>{eventDetails.description}</p>
            )}
          </div>
          <div className="flex items-start gap-2 text-foreground/80">
              <Users className="h-5 w-5 mt-1 shrink-0" />
              <div>
                  <h3 className="font-semibold">Organized by:</h3>
                   {isEditing ? (
                    <Input 
                      name="organizers" 
                      value={editedDetails.organizers.join(', ')} 
                      onChange={(e) => setEditedDetails(prev => ({ ...prev, organizers: e.target.value.split(',').map(s => s.trim())}))}
                      className="w-full"
                    />
                  ) : (
                    <p>{eventDetails.organizers.join(', ')}</p>
                  )}
              </div>
          </div>
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
              {paginatedRsvpList.map((rsvp) => (
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
           <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
