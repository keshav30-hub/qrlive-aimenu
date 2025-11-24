
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/use-currency';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Bell,
  ConciergeBell,
  FileText,
  Sparkles,
  GlassWater,
  SprayCan,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getBusinessDataBySlug, getEvents, getMenuData, type BusinessData, type Event, type Category, submitServiceRequest } from '@/lib/qrmenu';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

export default function QrMenuPage() {
  const params = useParams();
  const { 'business-name': businessSlug, 'table-number': tableNumber } = params;
  const { format } = useCurrency();
  const { toast } = useToast();
  const { firestore } = useUser();
  const router = useRouter();

  const [cart, setCart] = useState<any[]>([]);

  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);

  // Fetch real-time events
  const eventsRef = useMemoFirebase(() => {
    if (!userId) return null;
    return query(collection(firestore, 'users', userId, 'events'), where('active', '==', true));
  }, [firestore, userId]);
  const { data: events, isLoading: eventsLoading } = useCollection<Event>(eventsRef);

  useEffect(() => {
    async function fetchData() {
      if (typeof businessSlug !== 'string') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { businessData: bd, userId: fetchedUserId } = await getBusinessDataBySlug(businessSlug as string);
      
      if (bd && fetchedUserId) {
        setBusinessData(bd);
        setUserId(fetchedUserId);
        const { categories: menuCategories } = await getMenuData(fetchedUserId);
        setCategories(menuCategories);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [businessSlug]);

  const handleServiceRequest = async (requestType: string) => {
    if (!userId || typeof tableNumber !== 'string' || typeof businessSlug !== 'string') return;

    const cooldownMinutes = 5;
    const cooldownKey = `serviceRequestCooldown_${businessSlug}_${tableNumber}`;
    const lastRequestTime = localStorage.getItem(cooldownKey);
    const now = new Date().getTime();

    if (lastRequestTime && (now - parseInt(lastRequestTime, 10)) < cooldownMinutes * 60 * 1000) {
      const remainingTime = Math.ceil((cooldownMinutes * 60 * 1000 - (now - parseInt(lastRequestTime, 10))) / (60 * 1000));
      toast({
        variant: "destructive",
        title: "Please wait",
        description: `You can make another request in ${remainingTime} minute(s).`,
      });
      return;
    }


    setIsRequestingService(true);
    try {
        await submitServiceRequest(userId, tableNumber, requestType);
        localStorage.setItem(cooldownKey, now.toString());
        toast({
            title: "Request Sent",
            description: "A staff member will be with you shortly.",
        });
        setIsServiceRequestDialogOpen(false); // Close dialog on success
    } catch(error) {
        console.error("Service request failed:", error);
        toast({
            variant: "destructive",
            title: "Request Failed",
            description: "Could not send your request. Please try again.",
        });
    } finally {
        setIsRequestingService(false);
    }
  };

  const addToCart = (item: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  
  const aifaUrl = `/qrmenu/${businessData?.businessId || businessSlug}/${tableNumber}/aifa`;

  if (isLoading || eventsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Menu...</div>
  }
  
  if (!businessData) {
     return <div className="flex h-screen items-center justify-center">Business not found.</div>
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-black">
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
        <header className="p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <Image
              src={businessData.logo}
              alt={`${businessData.name} logo`}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold">{businessData.name}</h1>
              <p className="text-sm text-muted-foreground">
                You are at Table {tableNumber}
              </p>
            </div>
          </div>
          <Dialog open={isServiceRequestDialogOpen} onOpenChange={setIsServiceRequestDialogOpen}>
            <DialogTrigger asChild>
                <Button size="icon" className="bg-primary text-primary-foreground">
                    <Bell className="h-6 w-6" />
                    <span className="sr-only">Call Waiter</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs sm:max-w-sm rounded-lg">
                 <DialogHeader>
                    <DialogTitle>Request Assistance</DialogTitle>
                    <DialogDescription>
                        Select a service and a staff member will be right with you.
                    </DialogDescription>
                 </DialogHeader>
                 <div className="flex flex-wrap gap-3 py-4">
                    {serviceRequests.map(req => (
                        <Button key={req.text} variant="outline" className="flex-grow h-16 flex-col gap-1" onClick={() => handleServiceRequest(req.text)} disabled={isRequestingService}>
                            {isRequestingService ? <Loader2 className="h-5 w-5 animate-spin"/> : req.icon}
                            <span>{req.text}</span>
                        </Button>
                    ))}
                 </div>
            </DialogContent>
          </Dialog>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          {(events || []).length > 0 && <section className="px-4 pb-4">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {events.map((event) => (
                  <CarouselItem key={event.id}>
                    <Link href={`/events/${event.id}`}>
                      <div className="relative h-40 w-full rounded-lg overflow-hidden">
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          data-ai-hint={event.imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4">
                          <h3 className="text-white font-bold text-lg">{event.name}</h3>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </section>}

          <main className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {(categories || []).map((category) => (
                  <Link key={category.name} href={`/qrmenu/${businessData?.businessId || businessSlug}/${tableNumber}/${category.name.toLowerCase().replace(/ /g, '-')}`}>
                      <Card className="overflow-hidden">
                          <div className="relative h-24 w-full">
                              <Image
                                  src={category.imageUrl}
                                  alt={category.name}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  data-ai-hint={category.imageHint}
                                />
                          </div>
                          <CardHeader className="p-3">
                              <CardTitle className="text-base text-center">{category.name}</CardTitle>
                          </CardHeader>
                      </Card>
                  </Link>
              ))}
            </div>
          </main>
        </ScrollArea>
        
        {cart.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <div className="px-4 py-2 z-10 border-t">
                <Button className="w-full h-12 text-lg shadow-lg">
                  <ShoppingBag className="mr-2" />
                  View Cart ({cart.length})
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-w-[480px] mx-auto rounded-t-2xl p-0"
            >
              <SheetHeader className="p-4 text-left">
                <SheetTitle>Your Order</SheetTitle>
                 <SheetDescription>
                  Review items and place your order.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 h-[40vh] overflow-y-auto">
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-grow">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(Number(item.price))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                           onClick={() => updateQuantity(item.id, 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  ))}
                </div>
              </div>
              <SheetFooter className="p-4 bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
                 <div className="w-full space-y-4">
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Apply Coupon" className="h-9" />
                        <Button variant="outline" className="h-9">Apply</Button>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>To Pay</span>
                      <span>{format(cartTotal)}</span>
                    </div>
                    <Button className="w-full h-12 text-lg">Place Order</Button>
                 </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
        
        <div className="fixed bottom-4 right-1/2 translate-x-[calc(50vw-1rem)] max-w-[calc(480px-2rem)] w-full sm:translate-x-0 sm:right-4 sm:max-w-none sm:w-auto" style={{ right: 'calc(50% - 224px + 1rem)'}}>
             <Link href={aifaUrl}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground"
                onClick={(e) => {
                    if(!userId) {
                        e.preventDefault();
                        toast({variant: 'destructive', title: 'AI Assistant Not Ready', description: 'Please wait a moment and try again.'})
                    }
                }}>
                    <Sparkles className="h-7 w-7" />
                    <span className="sr-only">AI Food Assistant</span>
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
