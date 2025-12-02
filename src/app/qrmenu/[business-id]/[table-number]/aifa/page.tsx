
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send, Sparkles, ImagePlus, Loader2, Trash2, ExternalLink, Instagram } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { runAifaFlow } from "@/ai/flows/aifa-flow";
import { type AIFALowInput, type MenuItemSchema, type ComboSchema } from "@/ai/flows/aifa-schema";
import { useCurrency } from "@/hooks/use-currency";
import { getBusinessDataBySlug, getEvents, getMenuData, type BusinessData, type Event, type Category as MenuCategory, type MenuItem, type Combo, submitFeedback, submitServiceRequest } from '@/lib/qrmenu';
import { Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useFirebaseStorage } from "@/firebase/storage/use-firebase-storage";
import { useFirebase } from "@/firebase";
import { trackAifaMessage, trackAifaOpen, trackFeedbackSubmission } from "@/lib/gtag";


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

const EventCard = ({ event, businessId }: { event: Event, businessId: string }) => (
    <Card className="w-full overflow-hidden my-2">
        <div className="relative h-32 w-full">
            <Image src={event.imageUrl} alt={event.name} layout="fill" objectFit="cover" data-ai-hint={event.imageHint} />
        </div>
        <div className="p-3">
            <h4 className="font-semibold">{event.name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            <div className="flex gap-2 mt-3">
                <Link href={`/qrmenu/${businessId}/events/${event.id}`} className="flex-1">
                    <Button className="w-full">
                         View Details
                    </Button>
                </Link>
            </div>
        </div>
    </Card>
);

const FeedbackTargetSelection = ({ onSelect }: { onSelect: (target: string) => void }) => {
    return (
        <div className="flex flex-wrap gap-2 justify-center py-2">
            <Button variant="outline" onClick={() => onSelect('Business')}>Business</Button>
            <Button variant="outline" onClick={() => onSelect('AIFA')}>AIFA</Button>
        </div>
    );
};

const FeedbackForm = ({ target, onSubmit }: { target: string, onSubmit: (feedback: any) => Promise<void> }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async () => {
        if (rating === 0 || (rating <= 2 && !comment.trim())) {
             return;
        }
        setIsSubmitting(true);
        trackFeedbackSubmission(rating);
        await onSubmit({
            target,
            rating,
            comment,
            imageFile,
        });
        setIsSubmitting(false);
    }

    const isSubmitDisabled = isSubmitting || rating === 0 || (rating <= 2 && !comment.trim());

    return (
        <div className="space-y-4 rounded-lg border bg-background p-4">
            <h4 className="font-medium text-center">Feedback for {target}</h4>
            <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} disabled={isSubmitting}>
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
            <Textarea placeholder="Tell us more about your experience..." value={comment} onChange={(e) => setComment(e.target.value)} disabled={isSubmitting} />
            
            <Label htmlFor="feedback-image" className={`cursor-pointer flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/50 p-4 text-muted-foreground ${!isSubmitting && 'hover:bg-accent'}`}>
                {imagePreview ? (
                    <Image src={imagePreview} alt="Image preview" width={80} height={80} className="h-20 w-20 object-cover rounded-md" />
                ) : (
                    <>
                        <ImagePlus className="h-6 w-6" />
                        <span>Upload Image (Optional)</span>
                    </>
                )}
            </Label>
            <Input id="feedback-image" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} disabled={isSubmitting} />
            
            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitDisabled}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
        </div>
    );
};

const GoogleReviewButton = ({ href }: { href: string }) => (
    <div className="py-2">
        <Link href={href} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Leave a Google Review
            </Button>
        </Link>
    </div>
);

const InstagramButton = ({ href }: { href: string }) => (
    <div className="py-2">
        <Link href={href} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full bg-[#E1306C] text-white hover:bg-[#c12a5c] hover:text-white">
                <Instagram className="mr-2 h-4 w-4" />
                Follow us on Instagram
            </Button>
        </Link>
    </div>
);

const ConfirmOrder = ({ orderText, onConfirm }: { orderText: string, onConfirm: () => void }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    
    const handleConfirm = async () => {
        setIsConfirming(true);
        await onConfirm();
        // The parent component will handle the success message from the server.
        setIsConfirming(false);
    }

    return (
        <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">{orderText}</p>
             <Button className="w-full" onClick={handleConfirm} disabled={isConfirming}>
                 {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Confirm Order & Call Captain
             </Button>
        </div>
    )
};


const processDataForServerAction = (data: any) => {
    return JSON.parse(JSON.stringify(data));
};

const HISTORY_LIMIT = 12; // Keep the last 12 messages (6 user, 6 AI)

export default function AIFAPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useFirebase();
    const businessId = params['business-id'] as string;
    const tableNumber = params['table-number'] as string;
    const { format } = useCurrency();
    const { toast } = useToast();
    const { uploadFile } = useFirebaseStorage();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showInitialActions, setShowInitialActions] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const [businessData, setBusinessData] = useState<BusinessData | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [combos, setCombos] = useState<Combo[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const activeEvents = useMemo(() => events.filter(e => e.active), [events]);

    const getInitialMessage = () => ({
        id: getUniqueMessageId(),
        sender: 'aifa' as const,
        content: `Hi! Welcome to ${businessData?.name || 'our restaurant'}. I'm AIFA, your personal food assistant. How can I help you today?`
    });

    const resetChat = () => {
        const initialMessage = getInitialMessage();
        setMessages([initialMessage]);
        sessionStorage.removeItem('aifa-chat-history');
        sessionStorage.setItem('aifa-chat-history', JSON.stringify([initialMessage]));
        setShowInitialActions(true);
        toast({ title: 'Chat cleared', description: 'Your conversation has been restarted.' });
    };

    useEffect(() => {
      async function fetchData() {
        if (typeof businessId !== 'string') return;
        
        setIsLoading(true);
        const { businessData: bd, userId } = await getBusinessDataBySlug(businessId);
        
        if (bd && userId) {
          setBusinessData(bd);
          const [fetchedEvents, menuData] = await Promise.all([
            getEvents(userId),
            getMenuData(userId)
          ]);
          setEvents(fetchedEvents);
          setMenuCategories(menuData.categories);
          setMenuItems(menuData.items);
          setCombos(menuData.combos);
        }
        setIsLoading(false);
      }
  
      fetchData();
    }, [businessId]);

    useEffect(() => {
        trackAifaOpen();
        if (isLoading) return;

        try {
          const savedMessagesJSON = sessionStorage.getItem('aifa-chat-history');
          if (savedMessagesJSON) {
            const savedMessages = JSON.parse(savedMessagesJSON);
            if (Array.isArray(savedMessages) && savedMessages.length > 0) {
              const textMessages = savedMessages.filter((msg: any) => typeof msg.content === 'string');
              if (textMessages.length > 1) { 
                setMessages(textMessages);
                setShowInitialActions(false);
                return;
              }
            }
          }
        } catch (error) {
          console.error("Failed to load chat history from session storage:", error);
        }
    
        const initialMessage = getInitialMessage();
        setMessages([initialMessage]);
        sessionStorage.setItem('aifa-chat-history', JSON.stringify([initialMessage]));
    }, [businessData, isLoading]);


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
                // Only store string-based messages for rehydration
                const serializableMessages = newMessages
                    .filter(msg => typeof msg.content === 'string')
                    .slice(-HISTORY_LIMIT); // Also limit history in session storage
                sessionStorage.setItem('aifa-chat-history', JSON.stringify(serializableMessages));
            } catch (error) {
                console.error("Failed to save chat history to session storage:", error);
            }
            return newMessages;
        });
    };
    
    const handleFeedbackSubmit = async (feedback: { target: string; rating: number; comment: string; imageFile: File | null; }) => {
        if (!businessData || !businessData.id) return;
    
        let imageUrl = '';
        if (feedback.imageFile && user) {
            const path = `users/${businessData.id}/feedback_images/${Date.now()}_${feedback.imageFile.name}`;
            const result = await uploadFile(path, feedback.imageFile);
            if (result) {
                imageUrl = result.downloadURL;
            } else {
                toast({ variant: 'destructive', title: 'Image Upload Failed', description: 'Could not upload your image. Please try submitting without one.' });
                return;
            }
        }
    
        try {
            await submitFeedback(businessData.id, { ...feedback, imageUrl }, tableNumber);
            
            const feedbackMessage = `submitted-${feedback.rating} star rating and ${feedback.comment || 'no description'}`;

            addMessage('user', feedbackMessage);
            await getAIResponse(feedbackMessage);

            toast({ title: "Feedback submitted successfully!" });

        } catch (error) {
            console.error("Feedback submission error:", error);
            addMessage('aifa', 'Sorry, I had trouble submitting your feedback. Please try again in a moment.');
            toast({ variant: "destructive", title: "Submission failed", description: "Could not submit your feedback." });
        }
    };
    
    const handleFeedbackTarget = (target: string) => {
        addMessage('user', `Feedback for ${target}`);
        setIsThinking(true);
        setTimeout(() => {
            addMessage('aifa', <FeedbackForm target={target} onSubmit={handleFeedbackSubmit} />);
            setIsThinking(false);
        }, 300);
    }
    
    const handleConfirmOrder = async (orderSummary: string) => {
        if (businessData?.id) {
            try {
                const taskDescription = `Order ready: ${orderSummary}`;
                await submitServiceRequest(businessData.id, tableNumber, taskDescription);
                toast({
                    title: "Order Confirmed!",
                    description: "A captain will be with you shortly to finalize your order.",
                });
                addMessage('aifa', "Excellent! I've notified our staff. They will be right with you to confirm everything.");
            } catch (error) {
                console.error("Failed to submit order confirmation task:", error);
                toast({
                    variant: "destructive",
                    title: "Confirmation Failed",
                    description: "We couldn't notify the staff. Please try again or call a captain.",
                });
            }
        }
    };

    const handleInitialAction = async (action: string) => {
        addMessage('user', action);
        setShowInitialActions(false);
        await getAIResponse(action);
    };
    
    const processAIResponse = (response: string) => {
        if (response.includes('[SUGGEST_FEEDBACK]')) {
            const cleanResponse = response.replace('[SUGGEST_FEEDBACK]', '').trim();
            if (cleanResponse) addMessage('aifa', cleanResponse);
            addMessage('aifa', <div><p>I can help with that. Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} /></div>);
        } else if (response.includes('[GOOGLE_REVIEW_LINK]')) {
            const cleanResponse = response.replace('[GOOGLE_REVIEW_LINK]', '').trim();
            addMessage('aifa', cleanResponse);
            if (businessData?.googleReviewLink) {
                 addMessage('aifa', <GoogleReviewButton href={businessData.googleReviewLink} />);
            }
        } else if (response.includes('[INSTAGRAM_LINK]')) {
            const cleanResponse = response.replace('[INSTAGRAM_LINK]', '').trim();
            addMessage('aifa', cleanResponse);
            if (businessData?.instagramLink) {
                addMessage('aifa', <InstagramButton href={businessData.instagramLink} />);
            }
        } else if (response.includes('[CONFIRM_ORDER]')) {
            const cleanResponse = response.replace('[CONFIRM_ORDER]', '').trim();
            const orderSummaryMatch = cleanResponse.match(/Here's your order so far:\s*(.*)/is);
            const orderSummary = orderSummaryMatch ? orderSummaryMatch[1].trim() : "Your confirmed order.";
            addMessage('aifa', <ConfirmOrder orderText={cleanResponse} onConfirm={() => handleConfirmOrder(orderSummary)} />);
        }
        else {
            addMessage('aifa', response);
        }
    };


    const getAIResponse = async (prompt: string) => {
        if (!businessData) return;
        setIsThinking(true);
        trackAifaMessage();
        const historyForAI = messages
            .filter(msg => typeof msg.content === 'string')
            .slice(-HISTORY_LIMIT) // Truncate history before sending
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
                content: msg.content as string
            }));
        
        try {
            const isAskingForEvents = /event|happening|special/i.test(prompt);

            if ((prompt === "Events" || isAskingForEvents) && activeEvents.length > 0) {
                 addMessage('aifa', "You're in for a treat! Here are our upcoming events. Let me know if you'd like to RSVP.");
                activeEvents.forEach(event => {
                    addMessage('aifa', <EventCard event={event} businessId={businessId} />);
                })
            } else if (prompt === "Give Feedback") {
                addMessage('aifa', <div><p>I appreciate you taking the time! Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} /></div>);
            }
            else {
                 const eventsForAI = activeEvents.map(e => ({
                    ...e,
                    datetime: new Date(e.datetime).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    organizers: Array.isArray(e.organizers) ? e.organizers : ((e.organizers as any) || '').split(',').map((s: string) => s.trim()).filter(Boolean),
                 }));

                const menuItemsForAI: MenuItemSchema[] = menuItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    price: (item.mrp || item.price || '0').toString(),
                    type: item.type,
                    description: item.description,
                    kcal: item.kcal || 'N/A',
                    tags: item.tags || [],
                    addons: (item.addons || []).map(a => ({ name: a.name, price: a.price.toString() })),
                    modifiers: (item.modifiers || []).map(m => ({ name: m.name, price: m.price.toString() })),
                }));

                const combosForAI: ComboSchema[] = combos.map((combo) => ({
                    name: combo.name,
                    items: combo.items,
                    price: combo.price.toString(),
                }));

                 const flowInput: AIFALowInput = {
                    businessName: businessData.name,
                    priceSymbol: format(0).replace(/[\d.,\s]/g, ''),
                    googleReviewLink: businessData.googleReviewLink,
                    instagramLink: businessData.instagramLink,
                    menuCategories: processDataForServerAction(menuCategories).map((c: any) => ({name: c.name, description: c.description || ''})),
                    menuItems: processDataForServerAction(menuItemsForAI),
                    combos: processDataForServerAction(combosForAI),
                    events: processDataForServerAction(eventsForAI),
                    history: historyForAI,
                    prompt,
                };
                const response = await runAifaFlow(flowInput);
                processAIResponse(response);
            }
        } catch(e: any) {
            console.error(e);
            addMessage('aifa', e.message || "Oops! My circuits are a bit scrambled. Could you try asking that again?");
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

    if (isLoading) {
        return (
             <div className="h-screen w-full bg-gray-100 dark:bg-black">
                <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg items-center justify-center">
                    <p>Loading AIFA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-gray-100 dark:bg-black">
            <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
                <header className="p-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                    <div className="flex items-center gap-2">
                        <Button size="icon" onClick={() => router.back()} className="bg-primary text-primary-foreground">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">AIFA</h1>
                            <p className="text-xs font-bold text-foreground/80">powered by QRLIVE</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetChat}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <span className="sr-only">Delete Chat</span>
                    </Button>
                </header>
                
                <ScrollArea className="flex-1 z-0" viewportRef={scrollViewportRef}>
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

                <div className="p-4 bg-white dark:bg-gray-950 border-t z-20">
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

                <footer className="text-center p-2 bg-gray-100 dark:bg-black border-t">
                     <p className="text-xs text-muted-foreground">AIFA can make mistakes.</p>
                </footer>
            </div>
        </div>
    );
}
