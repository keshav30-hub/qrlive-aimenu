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
import { Calendar as CalendarIcon, MoreVertical, PlusCircle } from 'lucide-react';
import { placeHolderImages } from '@/lib/placeholder-images';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import React from 'react';
import { format } from 'date-fns';

const events = [
  {
    id: '1',
    name: 'Jazz Night',
    description: 'Enjoy a relaxing evening with live jazz music.',
    datetime: '2023-11-15 19:00',
    imageUrl: placeHolderImages.find(p => p.id === 'event1')?.imageUrl || '',
    imageHint: placeHolderImages.find(p => p.id === 'event1')?.imageHint || '',
    active: true,
  },
  {
    id: '2',
    name: 'Taco Tuesday',
    description: 'Special discounts on all tacos and margaritas.',
    datetime: '2023-11-21 17:00',
    imageUrl: placeHolderImages.find(p => p.id === 'event2')?.imageUrl || '',
    imageHint: placeHolderImages.find(p => p.id === 'event2')?.imageHint || '',
    active: false,
  },
  {
    id: '3',
    name: 'Wine Tasting',
    description: 'Explore a selection of fine wines from around the world.',
    datetime: '2023-12-01 18:30',
    imageUrl: placeHolderImages.find(p => p.id === 'event3')?.imageUrl || '',
    imageHint: placeHolderImages.find(p => p.id === 'event3')?.imageHint || '',
    active: true,
  },
    {
    id: '4',
    name: 'Oktoberfest',
    description: 'Celebrate with traditional German beer and food.',
    datetime: '2023-10-05 12:00',
    imageUrl: placeHolderImages.find(p => p.id === 'event4')?.imageUrl || '',
    imageHint: placeHolderImages.find(p => p.id === 'event4')?.imageHint || '',
    active: true,
  },
];

export default function EventsPage() {
  const [date, setDate] = React.useState<Date>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Event
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Event</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new event.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-120px)] pr-4">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-image">Event Image</Label>
                <Input id="event-image" type="file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Input id="event-name" placeholder="e.g. Summer Festival" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea id="event-description" placeholder="Describe the event..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Time</Label>
                  <Input id="event-time" type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-organizers">Event Organizers (Optional)</Label>
                <Input id="event-organizers" placeholder="e.g. John Doe, Jane Smith" />
              </div>
            </div>
            </ScrollArea>
            <SheetFooter>
              <Button type="submit" className="w-full">Save Event</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden flex flex-col">
            <Link href={`/events/${event.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-grow">
              <div className="relative w-full h-48">
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  fill
                  objectFit="cover"
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
                <Switch id={`event-toggle-${event.id}`} checked={event.active} />
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
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
