
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
import Link from 'next/link';
import { runAifaFlow } from "@/ai/flows/aifa-flow";
import { type AIFALowInput } from "@/ai/flows/aifa-schema";
import { menu as menuData, events as allEvents, businessData } from '@/lib/qrmenu-mock';
import { useCurrency } from "@/hooks/use-currency";


type Message = {
    id: string;
    sender: 'user' | 'aifa';
    content: React.ReactNode;
};

// Helper to generate unique IDs for messages, avoiding duplicates from Date.now()
let messageIdCounter = 0;
const getUniqueMessageId = () => {
    return `${Date.now()}-${messageIdCounter++}`;
};

const InitialActions = ({ onSelect, showEventsButton }: { onSelect: (action: string) => void, showEventsButton: boolean }) => (
    <div className="flex flex-wrap gap-2 justify-center py-2">
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
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            <div className="flex gap-2 mt-3">
                <Link href={`/events/${event.id}`} className="flex-1">
                    <Button className="w-full">
                         View Details
                    </Button>
                </Link>
            </div>
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
    const businessNameParam = params['business-name'] ? (params['business-name'] as string).replace(/-/g, ' ') : businessData.name;
    const { format } = useCurrency();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showInitialActions, setShowInitialActions] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const activeEvents = useMemo(() => allEvents.filter(e => e.active), []);

    useEffect(() => {
        try {
          const savedMessagesJSON = sessionStorage.getItem('aifa-chat-history');
          if (savedMessagesJSON) {
            const savedMessages = JSON.parse(savedMessagesJSON);
            if (Array.isArray(savedMessages) && savedMessages.length > 0) {
              // Ensure we only load string content, not components
              const textMessages = savedMessages.filter((msg: any) => typeof msg.content === 'string');
              if (textMessages.length > 0) {
                setMessages(textMessages);
                setShowInitialActions(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error("Failed to load chat history from session storage:", error);
        }
    
        const initialMessage = {
          id: getUniqueMessageId(),
          sender: 'aifa' as const,
          content: `Hi! Welcome to ${businessNameParam}. I'm AIFA, your personal food assistant. How can I help you today?`
        };
        setMessages([initialMessage]);
        sessionStorage.setItem('aifa-chat-history', JSON.stringify([initialMessage]));
    }, [businessNameParam]);


    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTo({
                top: scrollViewportRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);


    const addMessage = (sender: 'user' | 'aifa', content: React.ReactNode) => {
        setMessages(prev => {
            const newMessages = [...prev, { id: getUniqueMessageId(), sender, content }];
            try {
                // Save only serializable messages (strings) to prevent component storage
                const serializableMessages = newMessages.filter(msg => typeof msg.content === 'string');
                sessionStorage.setItem('aifa-chat-history', JSON.stringify(serializableMessages));
            } catch (error) {
                console.error("Failed to save chat history to session storage:", error);
            }
            return newMessages;
        });
    };
    
    const handleFeedbackTarget = (target: string) => {
        addMessage('user', `Feedback for ${target}`);
        setIsThinking(true);
        setTimeout(() => {
            addMessage('aifa', <FeedbackForm target={target} />);
            setIsThinking(false);
        }, 300);
    }

    const handleInitialAction = async (action: string) => {
        addMessage('user', action);
        setShowInitialActions(false);
        await getAIResponse(action);
    };
    
    const processAIResponse = (response: string) => {
        if (response.includes('[SUGGEST_FEEDBACK]')) {
            const cleanResponse = response.replace('[SUGGEST_FEEDBACK]', '').trim();
            addMessage('aifa', cleanResponse);
            addMessage('aifa', <div><p>I can help with that. Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} /></div>);
        } else {
            addMessage('aifa', response);
        }
    };


    const getAIResponse = async (prompt: string) => {
        setIsThinking(true);

        const historyForAI = messages
            .filter(msg => typeof msg.content === 'string') // Crucially, only send string content
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
                content: msg.content as string
            }));
        
        try {
            const isAskingForEvents = /event|happening|special/i.test(prompt);

            if ((prompt === "Events" || isAskingForEvents) && activeEvents.length > 0) {
                 addMessage('aifa', "You're in for a treat! Here are our upcoming events. Let me know if you'd like to RSVP.");
                activeEvents.forEach(event => {
                    addMessage('aifa', <EventCard event={event} />);
                })
            } else if (prompt === "Give Feedback") {
                addMessage('aifa', <div><p>I appreciate you taking the time! Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} /></div>);
            }
            else {
                 const flowInput: AIFALowInput = {
                    businessName: businessNameParam,
                    priceSymbol: format(0).replace(/[\d.,\s]/g, ''),
                    menuCategories: menuData.categories.map(c => ({name: c.name, description: c.description})),
                    menuItems: menuData.items.map(i => ({...i, price: i.price.toString(), tags: i.tags || [] })),
                    events: allEvents,
                    history: historyForAI,
                    prompt,
                };
                const response = await runAifaFlow(flowInput);
                processAIResponse(response);
            }
        } catch(e) {
            console.error(e);
            addMessage('aifa', "Oops! My circuits are a bit scrambled. Could you try asking that again?");
        } finally {
            setIsThinking(false);
        }
    };


    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            const userMessage = inputValue.trim();
            addMessage('user', userMessage);
            setInputValue('');
            setShowInitialActions(false);
            await getAIResponse(userMessage);
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
                        <p className="text-xs font-bold text-foreground/80">powered by QRLIVE</p>
                    </div>
                </header>
                
                <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
                    <div className="space-y-6 p-4">
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
                        {isThinking && (
                             <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                </Avatar>
                                <div className="rounded-lg px-4 py-2 max-w-[85%] bg-gray-200 dark:bg-gray-800">
                                    <p className="text-sm">Thinking...</p>
                                 </div>
                            </div>
                        )}
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
                            disabled={isThinking}
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={isThinking || !inputValue.trim()}>
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
