
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send, Sparkles, Ticket, Star, ImagePlus } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mock data for events - in a real app, this would be fetched
const allEvents = [
  {
    id: '1',
    name: 'Jazz Night',
    description: 'Enjoy a relaxing evening with live jazz music.',
    imageUrl: 'https://picsum.photos/seed/event1/600/400',
    imageHint: 'jazz band',
    active: true,
  },
  {
    id: '3',
    name: 'Wine Tasting',
    description: 'Explore a selection of fine wines.',
    imageUrl: 'https://picsum.photos/seed/event3/600/400',
    imageHint: 'wine glasses',
    active: true,
  },
  {
    id: '2',
    name: 'Taco Tuesday',
    description: 'Special discounts on all tacos and margaritas.',
    imageUrl: 'https://picsum.photos/seed/event2/600/400',
    imageHint: 'tacos food',
    active: false,
  }
];


type Message = {
    id: number;
    sender: 'user' | 'aifa';
    content: React.ReactNode;
};

const InitialActions = ({ onSelect, showEventsButton }: { onSelect: (action: string) => void, showEventsButton: boolean }) => (
    <div className="flex gap-2 justify-center py-2">
        <Button variant="outline" onClick={() => onSelect('Menu')}>Menu</Button>
        <Button variant="outline" onClick={() => onSelect('Give Feedback')}>Give Feedback</Button>
        {showEventsButton && <Button variant="outline" onClick={() => onSelect('Events')}>Events</Button>}
    </div>
);

const EventCard = ({ event }: { event: typeof allEvents[0] }) => (
    <Card className="w-full overflow-hidden my-2">
        <div className="relative h-32 w-full">
            <Image src={event.imageUrl} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.imageHint} />
        </div>
        <div className="p-3">
            <h4 className="font-semibold">{event.name}</h4>
            <p className="text-sm text-muted-foreground">{event.description}</p>
            <Button className="w-full mt-3">
                <Ticket className="mr-2 h-4 w-4" /> RSVP
            </Button>
        </div>
    </Card>
);

const FeedbackTargetSelection = ({ onSelect }: { onSelect: (target: string) => void }) => (
    <div className="flex gap-2 justify-center py-2">
        <Button variant="outline" onClick={() => onSelect('Business')}>Business</Button>
        <Button variant="outline" onClick={() => onSelect('AIFA')}>AIFA</Button>
    </div>
);

const FeedbackForm = ({ target }: { target: string }) => {
    const [rating, setRating] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4 rounded-lg border bg-background p-4">
            <h4 className="font-medium text-center">Feedback for {target}</h4>
            <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}>
                        <Star
                            className={`h-8 w-8 ${
                                rating >= star
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                        />
                    </button>
                ))}
            </div>
            <Textarea placeholder="Tell us more about your experience..." />
            <div className="space-y-2">
                 <Label htmlFor="feedback-image" className="cursor-pointer flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/50 p-4 text-muted-foreground hover:bg-accent">
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Image preview" width={80} height={80} className="h-20 w-20 object-cover rounded-md" />
                    ) : (
                        <>
                            <ImagePlus className="h-6 w-6" />
                            <span>Upload Image (Optional)</span>
                        </>
                    )}
                </Label>
                <Input id="feedback-image" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
            </div>
            <Button className="w-full">
                <Send className="mr-2 h-4 w-4" /> Submit Feedback
            </Button>
        </div>
    );
};


export default function AIFAPage() {
    const router = useRouter();
    const params = useParams();
    const businessName = params['business-name'] ? (params['business-name'] as string).replace(/-/g, ' ') : 'our cafe';
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showInitialActions, setShowInitialActions] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const activeEvents = useMemo(() => allEvents.filter(e => e.active), []);

    useEffect(() => {
        setMessages([
            {
                id: 1,
                sender: 'aifa',
                content: `Hi! Welcome to ${businessName}. I'm AIFA, your personal food assistant. How can I help you today?`
            }
        ]);
    }, [businessName]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);


    const addMessage = (sender: 'user' | 'aifa', content: React.ReactNode) => {
        setMessages(prev => [...prev, { id: Date.now(), sender, content }]);
    }
    
    const handleFeedbackTarget = (target: string) => {
        addMessage('user', `Feedback for ${target}`);
        setTimeout(() => {
            addMessage('aifa', <FeedbackForm target={target} />);
        }, 300);
    }

    const handleInitialAction = (action: string) => {
        addMessage('user', action);
        setShowInitialActions(false);

        setTimeout(() => {
            if (action === 'Menu') {
                addMessage('aifa', "Great choice! To give you the best recommendation, tell me: what's your mood? Or do you have any dietary preferences?");
            } else if (action === 'Give Feedback') {
                addMessage('aifa', <div><p>I appreciate you taking the time! Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} /></div>);
            } else if (action === 'Events') {
                addMessage('aifa', "You're in for a treat! Here are our upcoming events. Let me know if you'd like to RSVP.");
                activeEvents.forEach(event => {
                    addMessage('aifa', <EventCard event={event} />);
                })
            }
        }, 500);
    };

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            addMessage('user', inputValue.trim());
            setInputValue('');
            // Here you would typically call your AI flow and get a response
            setTimeout(() => {
                 addMessage('aifa', "That's an interesting question! While I'm still learning, why not try our chef's special? It's a crowd-pleaser!");
            }, 1000);
        }
    };


    return (
        <div className="bg-gray-100 dark:bg-black min-h-screen">
            <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-950 shadow-lg relative flex flex-col h-screen">
                <header className="p-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">AIFA</h1>
                        <p className="text-xs text-muted-foreground">powered by QRLIVE</p>
                    </div>
                </header>
                
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {messages.map(message => (
                            <div key={message.id} className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                {message.sender === 'aifa' && (
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-4 py-2 max-w-[85%] break-words ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                    { typeof message.content === 'string' ? <p className="text-sm">{message.content}</p> : message.content }
                                </div>
                             </div>
                        ))}
                         {showInitialActions && <InitialActions onSelect={handleInitialAction} showEventsButton={activeEvents.length > 0} />}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white dark:bg-gray-950 border-t">
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Ask me for suggestions..." 
                            className="flex-1"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={showInitialActions}
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={showInitialActions}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <footer className="text-center p-2 bg-gray-100 dark:bg-black">
                     <p className="text-xs text-muted-foreground">AIFA can make mistakes.</p>
                </footer>
            </div>
        </div>
    );
}
