
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
import { User, Calendar, Clock, Info, Users, PlusCircle, FilePenLine, Trash2, Download, ChevronLeft, Check, X, Loader2 } from 'lucide-react';
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
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type Rsvp = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  people: number;
  status: 'Attended' | 'Interested' | 'No Show';
};

type EventDetails = {
  id: string;
  name: string;
  description: string;
  datetime: string;
  imageUrl: string;
  imageHint: string;
  organizers: string[];
  terms?: string;
};

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
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingRsvp, setIsAddingRsvp] = useState(false);

  const eventRef = useMemoFirebase(() => {
    if (!user || !params.eventId) return null;
    return doc(firestore, 'users', user.uid, 'events', params.eventId);
  }, [firestore, user, params.eventId]);

  const rsvpsRef = useMemoFirebase(() => {
    if (!eventRef) return null;
    return collection(eventRef, 'rsvps');
  }, [eventRef]);

  const { data: eventDetails, isLoading: eventLoading, error: eventError } = useDoc<EventDetails>(eventRef);
  const { data: rsvpList, isLoading: rsvpsLoading } = useCollection<Rsvp>(rsvpsRef);

  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<EventDetails | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isRsvpDialogOpen, setIsRsvpDialogOpen] = useState(false);
  const [newRsvp, setNewRsvp] = useState({ name: '', mobile: '', email: '', people: 1, status: 'Interested'});

  const totalPages = Math.ceil((rsvpList || []).length / ITEMS_PER_PAGE);

  const paginatedRsvpList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return (rsvpList || []).slice(startIndex, endIndex);
  }, [currentPage, rsvpList]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  const handleStatusChange = async (rsvpId: string, newStatus: string) => {
    if (!rsvpsRef) return;
    const rsvpDoc = doc(rsvpsRef, rsvpId);
    try {
      await updateDoc(rsvpDoc, { status: newStatus });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update RSVP status."});
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.text("RSVP Details", 14, 16);
    (doc as any).autoTable({
      startY: 20,
      head: [['#', 'Name', 'Mobile Number', 'No. of People']],
      body: (rsvpList || []).map((rsvp, i) => [i + 1, rsvp.name, rsvp.mobile, rsvp.people]),
    });
    doc.save('rsvp-details.pdf');
  };

  const handleEditClick = () => {
    if (eventDetails) {
      setEditedDetails(eventDetails);
      setIsEditing(true);
    }
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    if (!eventRef || !editedDetails) return;
    setIsSaving(true);
    try {
      await updateDoc(eventRef, { ...editedDetails });
      setIsEditing(false);
      toast({ title: "Success", description: "Event details updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save event details." });
      console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!eventRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(eventRef);
      toast({ title: "Success", description: "Event deleted." });
      router.push('/dashboard/events');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete event." });
      console.error(e);
    } finally {
        setIsDeleting(false);
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedDetails) return;
    const { name, value } = e.target;
    setEditedDetails(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedDetails) return;
    const { name, value } = e.target;
    const currentDateTime = new Date(editedDetails.datetime);
    
    if (name === 'date') {
      const [year, month, day] = value.split('-').map(Number);
      currentDateTime.setFullYear(year, month - 1, day);
    } else if (name === 'time') {
      const [hours, minutes] = value.split(':').map(Number);
      currentDateTime.setHours(hours, minutes);
    }

    setEditedDetails(prev => prev ? ({ ...prev, datetime: currentDateTime.toISOString() }) : null);
  };

  const handleRsvpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewRsvp(prev => ({...prev, [id]: value }));
  }

  const handleSaveRsvp = async () => {
    if (!rsvpsRef || !newRsvp.name || !newRsvp.mobile) return;
    setIsAddingRsvp(true);
    try {
        await addDoc(rsvpsRef, { ...newRsvp, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "RSVP added." });
        setIsRsvpDialogOpen(false);
        setNewRsvp({ name: '', mobile: '', email: '', people: 1, status: 'Interested'});
    } catch(e) {
        toast({ variant: "destructive", title: "Error", description: "Could not add RSVP." });
        console.error(e);
    } finally {
        setIsAddingRsvp(false);
    }
  };

  if (eventLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  if (eventError || !eventDetails) {
    return <div className="flex h-screen items-center justify-center">Error loading event details. It might have been deleted.</div>;
  }

  const date = new Date(eventDetails.datetime);
  const editedDate = editedDetails ? new Date(editedDetails.datetime) : new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
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
            {isEditing && editedDetails ? (
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
                  <Button variant="outline" onClick={handleCancelClick} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveClick} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="icon" onClick={handleEditClick}>
                    <FilePenLine className="h-5 w-5" />
                    <span className="sr-only">Edit Event</span>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleDeleteClick} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
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
               {isEditing && editedDetails ? (
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
            {isEditing && editedDetails ? (
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
                   {isEditing && editedDetails ? (
                    <Input 
                      name="organizers" 
                      value={(editedDetails.organizers || []).join(', ')} 
                      onChange={(e) => setEditedDetails(prev => prev ? ({ ...prev, organizers: e.target.value.split(',').map(s => s.trim())}) : null)}
                      className="w-full"
                    />
                  ) : (
                    <p>{(eventDetails.organizers || []).join(', ')}</p>
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
            <Dialog open={isRsvpDialogOpen} onOpenChange={setIsRsvpDialogOpen}>
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
                    <Input id="name" placeholder="Guest Name" className="col-span-3" value={newRsvp.name} onChange={handleRsvpInputChange} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobile" className="text-right">
                      Mobile
                    </Label>
                    <Input id="mobile" placeholder="Mobile Number" type="tel" pattern="[0-9]{10}" maxLength={10} className="col-span-3" value={newRsvp.mobile} onChange={handleRsvpInputChange} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email (Optional)
                    </Label>
                    <Input id="email" type="email" placeholder="Email Address" className="col-span-3" value={newRsvp.email} onChange={handleRsvpInputChange} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="people" className="text-right">
                      No. of People
                    </Label>
                    <Input id="people" type="number" placeholder="1" className="col-span-3" value={newRsvp.people} onChange={(e) => setNewRsvp(p => ({...p, people: parseInt(e.target.value, 10)}))}/>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select value={newRsvp.status} onValueChange={(value) => setNewRsvp(p => ({...p, status: value as any}))}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveRsvp} disabled={isAddingRsvp}>
                    {isAddingRsvp ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isAddingRsvp ? 'Saving...' : 'Save RSVP'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rsvpsLoading ? (<p>Loading RSVPs...</p>) : (
          <>
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
                {paginatedRsvpList.map((rsvp, index) => (
                  <TableRow key={rsvp.id}>
                    <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
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
                            <DropdownMenuItem key={status} onSelect={() => handleStatusChange(rsvp.id, status)}>
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
            {(rsvpList || []).length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No RSVPs for this event yet.</p>
                </div>
            )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
