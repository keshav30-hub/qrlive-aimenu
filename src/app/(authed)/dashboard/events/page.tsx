
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon, MoreVertical, PlusCircle, Save, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseStorage } from '@/firebase/storage/use-firebase-storage';

type Event = {
  id: string;
  name: string;
  description: string;
  datetime: string;
  imageUrl: string;
  imageStoragePath?: string;
  imageHint: string;
  active: boolean;
  organizers: string;
  terms: string;
};

const defaultEvent: Omit<Event, 'id' | 'imageUrl' | 'imageHint' > = {
    name: '',
    description: '',
    datetime: new Date().toISOString(),
    active: true,
    organizers: '',
    terms: '',
};

export default function EventsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { uploadFile, deleteFile, isLoading: isUploading } = useFirebaseStorage();
  
  const eventsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'events') : null, [firestore, user]);
  const { data: eventsData, isLoading: eventsLoading } = useCollection<Event>(eventsRef);

  const events = eventsData || [];

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<Event>>(defaultEvent);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleAddClick = () => {
    setIsEditing(false);
    setCurrentEvent(defaultEvent);
    setIsSheetOpen(true);
  };

  const handleEditClick = (event: Event) => {
    setIsEditing(true);
    setCurrentEvent({
        ...event,
        datetime: new Date(event.datetime).toISOString(),
    });
    setIsSheetOpen(true);
  };
  
  const handleSave = async () => {
    if (!eventsRef || !user) return;
    setIsSaving(true);
    try {
      if (isEditing && currentEvent.id) {
          const eventDoc = doc(eventsRef, currentEvent.id);
          await updateDoc(eventDoc, { ...currentEvent, updatedAt: serverTimestamp() });
          toast({ title: "Success", description: "Event updated." });
      } else {
          await addDoc(eventsRef, { 
              ...currentEvent,
              imageUrl: currentEvent.imageUrl || `https://picsum.photos/seed/event${events.length + 1}/600/400`,
              imageHint: currentEvent.imageHint || 'new event',
              createdAt: serverTimestamp() 
          });
          toast({ title: "Success", description: "Event added." });
      }
      setIsSheetOpen(false);
      setCurrentEvent(defaultEvent);
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save event." });
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (event: Event) => {
    if (!eventsRef) return;
    setIsDeleting(true);
    try {
      if (event.imageStoragePath) {
        await deleteFile(event.imageStoragePath);
      }
      await deleteDoc(doc(eventsRef, event.id));
      toast({ title: "Success", description: "Event deleted." });
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete event." });
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleToggleSwitch = async (eventId: string, active: boolean) => {
    if (!eventsRef) return;
    try {
      const eventDoc = doc(eventsRef, eventId);
      await updateDoc(eventDoc, { active });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not update event status." });
      console.error(e);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setCurrentEvent(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
      if (!date || !currentEvent.datetime) return;
      const current = new Date(currentEvent.datetime);
      date.setHours(current.getHours(), current.getMinutes());
      setCurrentEvent(prev => ({ ...prev, datetime: date.toISOString() }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentEvent.datetime) return;
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(currentEvent.datetime);
      newDate.setHours(hours, minutes);
      setCurrentEvent(prev => ({ ...prev, datetime: newDate.toISOString() }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        const newPath = `users/${user.uid}/images/events/${Date.now()}_${file.name}`;
        
        const uploadResult = await uploadFile(newPath, file);
        if(uploadResult) {
            // Delete old image if it exists and we're editing
            if(isEditing && currentEvent.imageStoragePath) {
                await deleteFile(currentEvent.imageStoragePath);
            }
            setCurrentEvent(prev => ({
                ...prev,
                imageUrl: uploadResult.downloadURL,
                imageStoragePath: uploadResult.storagePath
            }));
            toast({ title: 'Image Uploaded', description: 'New event image is ready.' });
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload image.' });
        }
    }
  };
  
  const sheetDate = currentEvent.datetime ? new Date(currentEvent.datetime) : new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2" />
          Add Event
        </Button>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Update the details for your event.' : 'Fill in the details below to create a new event.'}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-120px)] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-image">Event Image</Label>
                {currentEvent.imageUrl && (
                    <div className="relative w-full h-40 rounded-md overflow-hidden">
                        <Image src={currentEvent.imageUrl} alt={currentEvent.name || "Event Image"} fill style={{objectFit: 'cover'}} />
                    </div>
                )}
                <Input id="event-image" type="file" onChange={handleImageChange} disabled={isUploading} />
                {isUploading && <p className="text-sm text-muted-foreground">Uploading image...</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" value={currentEvent.name} onChange={handleInputChange} placeholder="e.g. Summer Festival" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={currentEvent.description} onChange={handleInputChange} placeholder="Describe the event..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !sheetDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {sheetDate ? format(sheetDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={sheetDate}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" value={format(sheetDate, "HH:mm")} onChange={handleTimeChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizers">Event Organizers (Optional)</Label>
                <Input id="organizers" value={currentEvent.organizers} onChange={handleInputChange} placeholder="e.g. John Doe, Jane Smith" />
              </div>
               <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Terms & Conditions (Optional)</AccordionTrigger>
                  <AccordionContent>
                    <Textarea id="terms" value={currentEvent.terms} onChange={handleInputChange} placeholder="Enter terms and conditions for the event." />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            </ScrollArea>
            <SheetFooter>
               <Button variant="outline" onClick={() => setIsSheetOpen(false)} disabled={isSaving || isUploading}>Cancel</Button>
               <Button onClick={handleSave} disabled={isSaving || isUploading}>
                 {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                 {isSaving ? 'Saving...' : 'Save Event'}
               </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

      {eventsLoading ? (
        <p>Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col">
              <Link href={`/dashboard/events/${event.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-grow">
                <div className="relative w-full h-48">
                  <Image
                    src={event.imageUrl}
                    alt={event.name}
                    fill
                    style={{objectFit: 'cover'}}
                    data-ai-hint={event.imageHint}
                  />
                </div>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{new Date(event.datetime).toLocaleString()}</p>
                </CardContent>
              </Link>
              <CardFooter className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 mt-auto">
                <div className="flex items-center gap-2">
                  <Switch 
                    id={`event-toggle-${event.id}`} 
                    checked={event.active} 
                    onCheckedChange={(checked) => handleToggleSwitch(event.id, checked)}
                  />
                  <label htmlFor={`event-toggle-${event.id}`} className="text-sm font-medium">
                    {event.active ? 'Active' : 'Inactive'}
                  </label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditClick(event)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(event)} disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
       {events.length === 0 && !eventsLoading && (
          <div className="text-center py-10 text-muted-foreground">
            <p>No events created yet. Click "Add Event" to get started.</p>
          </div>
        )}
    </div>
  );
}
