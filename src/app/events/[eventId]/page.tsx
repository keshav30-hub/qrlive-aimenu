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
import { User, Calendar, Clock, Info, Users } from 'lucide-react';

const eventDetails = {
  id: '1',
  name: 'Jazz Night',
  description: 'Enjoy a relaxing evening with live jazz music featuring some of the best local artists. The night will be filled with smooth melodies and a great atmosphere. Perfect for a date night or a night out with friends. Full bar and a special cocktail menu will be available.',
  datetime: '2023-11-15 19:00',
  imageUrl: placeHolderImages.find((p) => p.id === 'event1')?.imageUrl || '',
  imageHint: placeHolderImages.find((p) => p.id === 'event1')?.imageHint || '',
  organizers: ['The Velvet Note Club', 'City Jazz Association'],
};

const rsvpList = [
  {
    seq: 1,
    name: 'Alice Johnson',
    mobile: '555-0101',
    email: 'alice@example.com',
    people: 2,
    status: 'Confirmed',
  },
  {
    seq: 2,
    name: 'Bob Williams',
    mobile: '555-0102',
    email: 'bob@example.com',
    people: 1,
    status: 'Pending',
  },
  {
    seq: 3,
    name: 'Charlie Brown',
    mobile: '555-0103',
    email: 'charlie@example.com',
    people: 4,
    status: 'Confirmed',
  },
  {
    seq: 4,
    name: 'Diana Prince',
    mobile: '555-0104',
    email: 'diana@example.com',
    people: 2,
    status: 'Cancelled',
  },
    {
    seq: 5,
    name: 'Ethan Hunt',
    mobile: '555-0105',
    email: 'ethan@example.com',
    people: 3,
    status: 'Confirmed',
  },
   {
    seq: 6,
    name: 'Fiona Glenanne',
    mobile: '555-0106',
    email: 'fiona@example.com',
    people: 1,
    status: 'Confirmed',
  },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'Confirmed':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'Pending':
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Event Details</h1>
      
      <Card className="overflow-hidden">
        <div className="relative w-full h-64 md:h-80">
          <Image
            src={eventDetails.imageUrl}
            alt={eventDetails.name}
            fill
            objectFit="cover"
            data-ai-hint={eventDetails.imageHint}
          />
        </div>
        <CardHeader>
          <CardTitle className="text-4xl">{eventDetails.name}</CardTitle>
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
        <CardHeader>
          <CardTitle>RSVP Details</CardTitle>
          <CardDescription>
            Here are the details of guests who have RSVP'd to the event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Email ID</TableHead>
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
                  <TableCell>{rsvp.email}</TableCell>
                  <TableCell className="text-center">{rsvp.people}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rsvp.status)} className="capitalize">
                      {rsvp.status}
                    </Badge>
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
