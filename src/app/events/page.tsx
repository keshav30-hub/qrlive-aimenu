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
import { MoreVertical, PlusCircle } from 'lucide-react';
import { placeHolderImages } from '@/lib/placeholder-images';

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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button>
          <PlusCircle className="mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden flex flex-col">
            <Link href={`/events/${event.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-grow">
              <div className="relative w-full h-48">
                <Image
                  src={event.imageUrl}
                  alt={event.name}
                  layout="fill"
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
