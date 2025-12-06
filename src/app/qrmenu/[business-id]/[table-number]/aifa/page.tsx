
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send, Sparkles, ImagePlus, Loader2, Trash2, ExternalLink, Instagram, History } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { format } from 'date-fns';

type Message = {
    id: string;
    sender: 'user' | 'aifa';
    content: React.ReactNode;
};

type Order = {
    timestamp: string;
    items: string[];
};

// Helper to generate unique IDs for messages, avoiding duplicates from Date.now()
let messageIdCounter = 0;
const getUniqueMessageId = () => {
    return `${Date.now()}-${messageIdCounter++}`;
};

const ChipButton = ({ text, onSelect }: { text: string; onSelect: (text: string) => void }) => (
    <Button
        variant="secondary"
        size="sm"
        className="h-auto py-1 px-3 bg-white text-black hover:bg-white/90"
        onClick={() => onSelect(text)}
    >
        {text}
    </Button>
);

const InitialActions = ({ onSelect, showEventsButton }: { onSelect: (action: string) => void, showEventsButton: boolean }) => (
    <div className="flex flex-wrap gap-2 justify-center py-2">
        <ChipButton text="Menu" onSelect={onSelect} />
        <ChipButton text="Give Feedback" onSelect={onSelect} />
        {showEventsButton && <ChipButton text="Events" onSelect={onSelect} />}
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

const FeedbackTargetSelection = ({ onSelect, businessName }: { onSelect: (target: string) => void; businessName: string; }) => {
    return (
        <div className="flex flex-wrap gap-2 justify-center py-2">
            <ChipButton text={businessName} onSelect={onSelect} />
            <ChipButton text="AIFA" onSelect={onSelect} />
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

const ConfirmOrder = ({ orderText, onConfirm }: { orderText: string, onConfirm: (items: string[]) => void }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Function to parse items from the order summary text
    const parseOrderItems = (text: string): string[] => {
        const lines = text.split('\n').map(line => line.trim());
        const items: string[] = [];
        lines.forEach(line => {
             // Regex to match patterns like "1 Classic Chicken Burger (Large)" or "2 Grilled Paneer Sandwiches"
            const match = line.match(/(\d+)\s*(.*?)(?:\s\(.*\))?$/);
            if (match) {
                const quantity = parseInt(match[1], 10);
                const itemName = match[2].trim();
                for (let i = 0; i < quantity; i++) {
                    items.push(itemName);
                }
            } else if (line.match(/^\d+x\s/)) { // for "1x Item" format
                items.push(line);
            }
        });
        // A fallback if parsing fails, just return the raw text
        return items.length > 0 ? items : [text];
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        const orderSummaryMatch = orderText.match(/Here's the order so far:\s*(.*)/is);
        const summaryText = orderSummaryMatch ? orderSummaryMatch[1].trim() : "Your confirmed order.";
        const parsedItems = parseOrderItems(summaryText);
        await onConfirm(parsedItems);
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
    const encodedTableNumber = params['table-number'] as string;
    const tableNumber = useMemo(() => decodeURIComponent(encodedTableNumber), [encodedTableNumber]);
    const { format } = useCurrency();
    const { toast } = useToast();
    const { uploadFile } = useFirebaseStorage();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const [itemBeingCustomized, setItemBeingCustomized] = useState<string | null>(null);

    const [businessData, setBusinessData] = useState<BusinessData | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [combos, setCombos] = useState<Combo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [orderHistory, setOrderHistory] = useState<Order[]>([]);
    const orderHistoryStorageKey = `aifa-order-history-${businessId}-${tableNumber}`;

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
        
        try {
            const savedHistory = sessionStorage.getItem(orderHistoryStorageKey);
            if (savedHistory) {
                setOrderHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load order history from session storage", e);
        }

        if (isLoading) return;

        try {
          const savedMessagesJSON = sessionStorage.getItem('aifa-chat-history');
          if (savedMessagesJSON) {
            const savedMessages = JSON.parse(savedMessagesJSON);
            if (Array.isArray(savedMessages) && savedMessages.length > 0) {
              const textMessages = savedMessages.filter((msg: any) => typeof msg.content === 'string');
              if (textMessages.length > 1) { 
                setMessages(textMessages);
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
    }, [businessData, isLoading, orderHistoryStorageKey]);


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
            
            let feedbackMessage = `submitted-${feedback.rating} star rating`;
            if (feedback.comment) {
                feedbackMessage += ` and comment: ${feedback.comment}`;
            }

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
            const isForBusiness = target === (businessData?.name || 'Business');
            const feedbackTarget = isForBusiness ? 'Business' : 'AIFA';
            const displayTarget = isForBusiness ? businessData?.name || 'the Business' : 'AIFA';
            addMessage('aifa', <FeedbackForm target={displayTarget} onSubmit={(feedback) => handleFeedbackSubmit({...feedback, target: feedbackTarget})} />);
            setIsThinking(false);
        }, 300);
    }
    
    const handleConfirmOrder = async (orderedItems: string[]) => {
        if (businessData?.id) {
            try {
                const taskDescription = `Order ready: ${orderedItems.join(', ')}`;
                await submitServiceRequest(businessData.id, tableNumber, taskDescription);
                
                // Add to order history
                const newOrder: Order = {
                    timestamp: new Date().toISOString(),
                    items: orderedItems,
                };

                setOrderHistory(prev => {
                    const updatedHistory = [...prev, newOrder];
                    sessionStorage.setItem(orderHistoryStorageKey, JSON.stringify(updatedHistory));
                    return updatedHistory;
                });

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

    const handleChipSelect = (action: string) => {
        // When a generic chip is selected, clear the item being customized.
        setItemBeingCustomized(null);
        addMessage('user', action);
        getAIResponse(action);
    };

    const handleOptionSelect = (option: string) => {
        if (itemBeingCustomized) {
            const fullPrompt = `Add ${itemBeingCustomized} with ${option}`;
            addMessage('user', fullPrompt);
            getAIResponse(fullPrompt);
            setItemBeingCustomized(null); // Clear after use
        }
    };

    const processAIResponse = (response: string) => {
        const chipRegex = /\[(CHIP|ADDON|MODIFIER):([^\]]+)\]/g;
        const matches = Array.from(response.matchAll(chipRegex));
    
        const mainText = response.replace(chipRegex, '').trim();
    
        if (matches.length > 0) {
            if (mainText) {
                addMessage('aifa', mainText);
            }
    
            const isOptionFlow = matches.some(m => m[1] === 'ADDON' || m[1] === 'MODIFIER');
            if (isOptionFlow) {
                // Find the item name from the last user message.
                // This is a bit brittle but should work for the current flow.
                const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user' && typeof m.content === 'string')?.content as string;
                if (lastUserMessage) {
                    const itemMatch = lastUserMessage.match(/Add (.+)/);
                    if (itemMatch && itemMatch[1]) {
                        setItemBeingCustomized(itemMatch[1]);
                    }
                }
            }
    
            const chips = matches.map((match, index) => {
                const type = match[1];
                const chipText = match[2];
                const onSelect = type === 'CHIP' ? handleChipSelect : handleOptionSelect;
                return <ChipButton key={`${chipText}-${index}`} text={chipText} onSelect={onSelect} />;
            });
            addMessage('aifa', <div className="flex flex-wrap gap-2">{chips}</div>);
    
        } else if (response.includes('[SUGGEST_FEEDBACK]')) {
            const cleanResponse = response.replace('[SUGGEST_FEEDBACK]', '').trim();
            if (cleanResponse) addMessage('aifa', cleanResponse);
            addMessage('aifa', <div><p>I can help with that. Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} businessName={businessData?.name || 'Business'} /></div>);
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
            addMessage('aifa', <ConfirmOrder orderText={cleanResponse} onConfirm={handleConfirmOrder} />);
        }
        else {
             if (mainText) {
                addMessage('aifa', mainText);
             }
        }
    };


    const getAIResponse = async (prompt: string) => {
        if (!businessData) return;
        setIsThinking(true);
        trackAifaMessage();
        const historyForAI = messages
            .filter(msg => typeof msg.content === 'string')
            .slice(-HISTORY_LIMIT) 
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
                addMessage('aifa', <div><p>I appreciate you taking the time! Who is this feedback for?</p><FeedbackTargetSelection onSelect={handleFeedbackTarget} businessName={businessData?.name || 'Business'} /></div>);
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
                    serves: item.serves,
                    ingredients: (item as any).ingredients || '',
                }));

                const combosForAI: ComboSchema[] = combos.map((combo) => ({
                    name: combo.name,
                    items: combo.items,
                    price: combo.price.toString(),
                    serves: combo.serves,
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
    
    const showInitialActions = messages.length <= 1;

    return (
        <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-black">
            <div className="max-w-[480px] mx-auto h-full flex flex-col bg-transparent shadow-lg">
                <header className="p-2 flex justify-between items-center flex-shrink-0 bg-black/10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Button size="icon" onClick={() => router.back()} className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-white">AIFA</h1>
                            <p className="text-xs font-bold text-white/80">powered by QRLIVE</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                                    <History className="h-5 w-5" />
                                    <span className="sr-only">Order History</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="max-w-[480px] mx-auto rounded-t-2xl">
                                <SheetHeader>
                                    <SheetTitle>Your Order History</SheetTitle>
                                    <SheetDescription>
                                        A record of orders you've placed in this session.
                                    </SheetDescription>
                                </SheetHeader>
                                <ScrollArea className="h-[60vh] mt-4">
                                {orderHistory.length === 0 ? (
                                    <p className="text-center text-muted-foreground pt-10">No orders placed yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {orderHistory.map((order, index) => (
                                            <div key={order.timestamp} className="p-3 border rounded-md">
                                                <p className="text-sm font-semibold">Order #{index + 1} - {format(new Date(order.timestamp), 'p')}</p>
                                                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                                                    {order.items.map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={resetChat}>
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Delete Chat</span>
                        </Button>
                    </div>
                </header>
                
                <ScrollArea className="flex-1 z-0" viewportRef={scrollViewportRef}>
                    <div className="space-y-6 p-4">
                        {messages.map(message => (
                            <div key={message.id} className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                {message.sender === 'aifa' && (
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-pink-500 text-white">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                    </Avatar>
                                )}
                                <div className={`rounded-lg px-4 py-2 max-w-[85%] break-words ${message.sender === 'user' ? 'bg-white text-gray-800' : 'bg-black/20 text-white backdrop-blur-md border border-white/10'}`}>
                                    { typeof message.content === 'string' ? <p className="text-sm">{message.content}</p> : message.content }
                                </div>
                             </div>
                        ))}
                        {isThinking && (
                             <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-pink-500 text-white">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                </Avatar>
                                <div className="rounded-lg px-4 py-2 max-w-[85%] bg-black/20 text-white backdrop-blur-md border border-white/10">
                                    <p className="text-sm">Thinking...</p>
                                 </div>
                            </div>
                        )}
                         {showInitialActions && <InitialActions onSelect={handleChipSelect} showEventsButton={activeEvents.length > 0} />}
                    </div>
                </ScrollArea>

                <div className="p-4 bg-transparent border-t border-white/10 z-20">
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="Ask me for suggestions..." 
                            className="flex-1 bg-white/10 text-white placeholder:text-white/60 border-white/20 focus:border-white/50"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isThinking}
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={isThinking || !inputValue.trim()} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <footer className="text-center p-2 bg-black/20 border-t border-white/10">
                     <p className="text-xs text-white/50">AIFA can make mistakes.</p>
                </footer>
            </div>
        </div>
    );
}
