

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
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrency } from '@/hooks/use-currency';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ConciergeBell,
  FileText,
  Loader2,
  Sparkles,
  Search,
  GlassWater,
  SprayCan,
  X,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getBusinessDataBySlug, getEvents, getMenuData, type BusinessData, type Event, type Category, submitServiceRequest, type MenuItem, type Combo, getQrliveContact, type QrliveContact } from '@/lib/qrmenu';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';
import { trackQrScan, trackWaiterCall } from '@/lib/gtag';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const serviceRequests = [
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

type CartItem = MenuItem & { quantity: number };

export default function QrMenuPage() {
  const params = useParams();
  const { 'business-id': businessId, 'table-number': encodedTableNumber } = params as { 'business-id': string, 'table-number': string };
  const tableNumber = useMemo(() => decodeURIComponent(encodedTableNumber), [encodedTableNumber]);
  const { format } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();
  const storageKey = `qrlive-cart-${businessId}-${tableNumber}`;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [qrliveContact, setQrliveContact] = useState<QrliveContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  useEffect(() => {
      try {
        const savedCart = localStorage.getItem(storageKey);
        if(savedCart) {
            setCart(JSON.parse(savedCart));
        }
      } catch (e) {
          console.error("Failed to parse cart from localStorage", e);
      }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, storageKey]);


  useEffect(() => {
    if (!carouselApi) {
      return
    }
 
    setCurrentSlide(carouselApi.selectedScrollSnap())
 
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  useEffect(() => {
    async function fetchData() {
      if (typeof businessId !== 'string') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      trackQrScan(businessId, tableNumber); // Track QR Scan event
      const { businessData: bd, userId: fetchedUserId } = await getBusinessDataBySlug(businessId as string);
      
      if (bd && fetchedUserId) {
        setBusinessData(bd);
        setUserId(fetchedUserId);
        const [menuData, eventsData, contactData] = await Promise.all([
          getMenuData(fetchedUserId),
          getEvents(fetchedUserId),
          getQrliveContact(),
        ]);
        setCategories(menuData.categories);
        setMenuItems(menuData.items);
        setCombos(menuData.combos);
        setEvents(eventsData);
        setQrliveContact(contactData);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [businessId, tableNumber]);

  const handleServiceRequest = async (requestType: string) => {
    if (!userId || typeof tableNumber !== 'string' || typeof businessId !== 'string') return;

    const cooldownMinutes = 5;
    const cooldownKey = `serviceRequestCooldown_${businessId}_${tableNumber}`;
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
    trackWaiterCall(requestType); // Track Waiter Call event
    try {
        await submitServiceRequest(userId, tableNumber, requestType);
        localStorage.setItem(cooldownKey, now.toString());
        toast({
            title: "Request Sent",
            description: "A staff member will be with you shortly.",
        });
        setIsServiceRequestDialogOpen(false);
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

  const handlePlaceOrder = async () => {
    if (!userId || typeof tableNumber !== 'string' || cart.length === 0) return;

    setIsPlacingOrder(true);
    let orderSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    if (orderNotes.trim()) {
        orderSummary += `. Notes: ${orderNotes.trim()}`;
    }
    const requestType = `New Order: ${orderSummary}`;
    trackWaiterCall('Place Order'); // Track Place Order event
    try {
      await submitServiceRequest(userId, tableNumber, requestType);
      toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the kitchen. A staff member will confirm it shortly.',
      });
      setCart([]);
      setOrderNotes('');
      setIsCartOpen(false);
    } catch (error) {
      console.error('Order placement failed:', error);
      toast({
        variant: 'destructive',
        title: 'Order Failed',
        description: 'We could not place your order. Please call a staff member.',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
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
    (total, item) => total + Number(item.mrp || item.price) * item.quantity,
    0
  );
  
  const aifaUrl = `/qrmenu/${businessId}/${encodedTableNumber}/aifa`;

  const availableCategories = useMemo(() => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes from midnight

    return categories.filter(category => {
      if (!category.availability || !category.availability.days || category.availability.days.length === 0) {
        return true; // Always available if no rules are set
      }

      const isDayAvailable = category.availability.days.includes(currentDay);
      if (!isDayAvailable) {
        return false;
      }
      
      const { startTime, endTime } = category.availability;
      if (startTime && endTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        if (startTotalMinutes <= endTotalMinutes) {
          return currentTime >= startTotalMinutes && currentTime <= endTotalMinutes;
        } else { // Handles overnight times (e.g., 22:00 to 02:00)
          return currentTime >= startTotalMinutes || currentTime <= endTotalMinutes;
        }
      }
      
      return true; // Available if day is set but time is not
    });
  }, [categories]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, menuItems]);

  const handleSuggestionClick = (item: MenuItem) => {
    const categorySlug = item.category.toLowerCase().replace(/ /g, '-');
    router.push(`/qrmenu/${businessId}/${encodedTableNumber}/${categorySlug}#${item.id}`);
    setSearchTerm('');
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Menu...</div>
  }
  
  if (!businessData) {
     return <div className="flex h-screen items-center justify-center">Business not found.</div>
  }

  const renderEventLink = (event: Event) => {
    const eventUrl = event.collectRsvp === false && event.url ? event.url : `/qrmenu/${businessId}/events/${event.id}`;
    const isExternal = event.collectRsvp === false && event.url;
    
    return (
        <Link href={eventUrl} target={isExternal ? '_blank' : '_self'} rel={isExternal ? 'noopener noreferrer' : ''}>
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
    );
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        {qrliveContact?.website ? (
             <a href={qrliveContact.website} target="_blank" rel="noopener noreferrer">
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full shadow-lg text-sm font-bold border border-white/30"
                >
                    QRLIVE
                </div>
            </a>
        ) : (
            <div
                className="fixed top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full shadow-lg text-sm font-bold border border-white/30"
            >
                QRLIVE
            </div>
        )}
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-transparent pt-12">
        <header className="p-2 flex justify-between items-center flex-shrink-0 bg-black/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Image
              src={businessData.logo}
              alt={`${businessData.name} logo`}
              width={60}
              height={40}
              className="rounded-md object-contain"
            />
            <div>
              <h1 className="text-base font-bold leading-tight text-white">{businessData.name}</h1>
              <p className="text-xs text-white/80">
                Table {tableNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="relative bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                        <ShoppingBag className="h-6 w-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        )}
                        <span className="sr-only">View Cart</span>
                    </Button>
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
                <ScrollArea className="px-4 h-[40vh]">
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
                            {format(Number(item.mrp || item.price))}
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
                     {cart.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Your cart is empty.</p>
                        </div>
                     )}
                    </div>
                </ScrollArea>
                <SheetFooter className="p-4 bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
                    <div className="w-full space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="order-notes">Order Notes (Optional)</Label>
                            <Textarea
                                id="order-notes"
                                placeholder="e.g., Make one dish less spicy..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center text-lg font-semibold">
                        <span>To Pay</span>
                        <span>{format(cartTotal)}</span>
                        </div>
                        <Button className="w-full h-12 text-lg" onClick={handlePlaceOrder} disabled={cart.length === 0 || isPlacingOrder}>
                            {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isPlacingOrder ? "Placing Order..." : "Place Order"}
                        </Button>
                    </div>
                </SheetFooter>
                </SheetContent>
            </Sheet>
          </div>
        </header>

        <div className="p-4 bg-black/10 backdrop-blur-md z-30">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                    placeholder="Search for any dish..."
                    className="pl-10 bg-white/10 text-white placeholder:text-white/60 border-white/20 focus:border-white/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/50 hover:bg-white/20 hover:text-white"
                        onClick={() => setSearchTerm('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                {searchResults.length > 0 && searchTerm && (
                    <div className="absolute top-full mt-2 w-full rounded-md border border-white/20 bg-black/90 backdrop-blur-lg z-20">
                        <ScrollArea className="max-h-60">
                            {searchResults.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSuggestionClick(item)}
                                    className="p-3 text-white text-sm cursor-pointer hover:bg-white/10"
                                >
                                    {item.name}
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          {(events || []).length > 0 && <section className="px-4 pb-4">
            <Carousel
              setApi={setCarouselApi}
              plugins={[autoplayPlugin.current]}
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
              onMouseEnter={autoplayPlugin.current.stop}
              onMouseLeave={autoplayPlugin.current.reset}
            >
              <CarouselContent>
                {events.map((event) => (
                  <CarouselItem key={event.id}>
                    {renderEventLink(event)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
             <div className="flex justify-center gap-2 mt-2">
                {events.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      currentSlide === index ? 'w-4 bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
            </div>
          </section>}
          
          <section className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
                <Dialog open={isServiceRequestDialogOpen} onOpenChange={setIsServiceRequestDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white transition-all hover:border-white/40 disabled:opacity-50"
                        >
                            <ConciergeBell className="h-5 w-5" />
                            <span className="font-semibold text-xs">Call Captain</span>
                        </button>
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
                 <button
                    onClick={() => handleServiceRequest('Get Bill')}
                    disabled={isRequestingService}
                    className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20 text-white transition-all hover:border-white/40 disabled:opacity-50"
                >
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold text-xs">Get Bill</span>
                </button>
            </div>
          </section>

          <main className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {availableCategories.map((category) => (
                  <Link key={category.name} href={`/qrmenu/${businessId}/${encodedTableNumber}/${category.name.toLowerCase().replace(/ /g, '-')}`}>
                      <Card className="overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 text-white transition-all hover:border-white/40">
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
              {combos.length > 0 && (
                  <Link href={`/qrmenu/${businessId}/${encodedTableNumber}/combos`}>
                      <Card className="overflow-hidden h-full flex flex-col bg-white/10 backdrop-blur-lg border border-white/20 text-white transition-all hover:border-white/40">
                           <div className="flex-grow flex items-center justify-center h-24">
                              <CardTitle className="text-base text-center">Combos</CardTitle>
                          </div>
                      </Card>
                  </Link>
             )}
            </div>
          </main>
        </ScrollArea>
        
        <div className="fixed bottom-4 right-4 z-20">
            <Link href={aifaUrl}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-pink-500 text-white hover:bg-pink-600"
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

