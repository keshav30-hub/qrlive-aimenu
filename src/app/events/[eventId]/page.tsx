
'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Calendar, Clock, Info, Users, Mail, Phone, Users2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { events } from '@/lib/qrmenu-mock';
import { useMemo } from 'react';

export default function PublicEventDetailsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const eventDetails = useMemo(() => {
    return events.find(e => e.id === eventId);
  }, [eventId]);

  if (!eventDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">This event may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const date = new Date(eventDetails.active ? '2023-11-15T19:00:00' : '2023-11-21T17:00:00');

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="p-0">
             <div className="relative w-full h-64 md:h-80">
                <Image
                    src={eventDetails.imageUrl}
                    alt={eventDetails.name}
                    fill
                    style={{objectFit: 'cover'}}
                    data-ai-hint={eventDetails.imageHint}
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-6">
                    <CardTitle className="text-4xl text-white">{eventDetails.name}</CardTitle>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div className="flex items-center gap-4 text-muted-foreground">
                    <div className='flex items-center gap-2'>
                        <Calendar className="h-5 w-5" />
                        <span>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Clock className="h-5 w-5" />
                        <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
                 <div className="flex items-start gap-4 text-foreground/80">
                    <Info className="h-5 w-5 mt-1 shrink-0" />
                    <p>{eventDetails.description}</p>
                </div>

                {eventDetails.active && (
                    <>
                        <div className="flex items-start gap-4 text-foreground/80">
                            <Users className="h-5 w-5 mt-1 shrink-0" />
                            <div>
                                <h3 className="font-semibold">Organized by:</h3>
                                <p>The Velvet Note Club, City Jazz Association</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 text-foreground/80">
                            <Info className="h-5 w-5 mt-1 shrink-0" />
                             <div>
                                <h3 className="font-semibold">Terms & Conditions:</h3>
                                <p>No outside food or drinks allowed.</p>
                            </div>
                        </div>
                    </>
                )}

            </div>
            <div className="md:col-span-1">
                <Card className="bg-gray-50 dark:bg-gray-900">
                    <CardHeader>
                        <CardTitle>RSVP for this Event</CardTitle>
                        <CardDescription>Fill out the form to confirm your attendance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="fullName" placeholder="Your Name" className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email">Email ID</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="email" type="email" placeholder="your@email.com" className="pl-10" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                             <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="mobile" type="tel" placeholder="9876543210" className="pl-10" pattern="[0-9]{10}" maxLength={10} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="people">Number of People</Label>
                            <div className="relative">
                                <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="people" type="number" min="1" defaultValue="1" className="pl-10" />
                            </div>
                        </div>
                        <Button className="w-full">Confirm RSVP</Button>
                    </CardContent>
                </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
