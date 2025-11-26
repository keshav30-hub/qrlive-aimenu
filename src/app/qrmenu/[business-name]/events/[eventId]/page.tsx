
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Info, Users, FileText, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getEventById, submitRsvp, type Event } from '@/lib/qrmenu';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function PublicEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const businessId = params['business-name'] as string;
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpData, setRsvpData] = useState({
    name: '',
    email: '',
    mobile: '',
    people: 1,
  });

  useEffect(() => {
    if (eventId && businessId) {
      const fetchEvent = async () => {
        setIsLoading(true);
        const eventData = await getEventById(businessId, eventId);
        setEvent(eventData);
        setIsLoading(false);
      };
      fetchEvent();
    }
  }, [eventId, businessId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
     if (id === 'people') {
      setRsvpData(prev => ({ ...prev, [id]: parseInt(value, 10) || 1 }));
    } else {
      setRsvpData(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.userId || !event.id) return;
    
    if(!rsvpData.name || !rsvpData.email || !rsvpData.mobile) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.'});
        return;
    }
    
    setIsSubmitting(true);
    try {
      await submitRsvp(event.userId, event.id, rsvpData);
      toast({ title: 'RSVP Submitted!', description: "Thank you for joining our event." });
      setRsvpData({ name: '', email: '', mobile: '', people: 1 });
    } catch (error) {
      console.error('Failed to submit RSVP', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your RSVP. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading event details...</div>;
  }

  if (!event) {
    return <div className="flex h-screen items-center justify-center">Event not found.</div>;
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-black">
      <div className="max-w-2xl mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
        <header className="p-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold truncate">{event.name}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
            <Image
              src={event.imageUrl}
              alt={event.name}
              fill
              style={{ objectFit: 'cover' }}
              data-ai-hint={event.imageHint}
            />
          </div>
          
          <div className="space-y-4">
              <div className="flex items-start gap-3 text-foreground/80">
                <Info className="h-5 w-5 mt-1 shrink-0" />
                <p>{event.description}</p>
              </div>
              {event.organizers && event.organizers.length > 0 && (
                <div className="flex items-start gap-3 text-foreground/80">
                  <Users className="h-5 w-5 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Organized by:</h3>
                    <p>{event.organizers.join(', ')}</p>
                  </div>
                </div>
              )}
          </div>
            
          {event.terms && (
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                     <div className="flex items-center gap-3">
                         <FileText className="h-5 w-5 shrink-0" />
                         <span className="font-semibold">Terms & Conditions</span>
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pl-8">
                     {event.terms}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
          )}

          <Card>
            <CardHeader>
              <CardTitle>RSVP for this Event</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your full name" value={rsvpData.name} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email ID</Label>
                  <Input id="email" type="email" placeholder="Enter your email" value={rsvpData.email} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" type="tel" placeholder="Enter your mobile number" value={rsvpData.mobile} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="people">Number of Persons</Label>
                  <Input id="people" type="number" min="1" value={rsvpData.people} onChange={handleInputChange} required disabled={isSubmitting}/>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
