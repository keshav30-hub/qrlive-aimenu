
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/use-currency';
import {
  ChevronLeft,
  Search,
  ConciergeBell,
  FileText,
  Sparkles,
  GlassWater,
  SprayCan,
  Loader2,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Bot
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessDataBySlug, getMenuData, type MenuItem, submitServiceRequest, type Combo } from '@/lib/qrmenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

type CartItem = (MenuItem | Combo) & { quantity: number; selectedModifiers?: any; selectedAddons?: any[]; finalPrice: number };

const loadingMessages = [
    "We are cooking something very special for you...",
    "Confused what to eat? Ask AIFA!",
    "Finding the most delicious dishes for you...",
    "Good food is on the way to the menu...",
    "Preparing the feast, please wait a moment!"
];

const LoadingComponent = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        setMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    }, []);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white">
            <Loader2 className="h-12 w-12 animate-spin mb-4" />
            <p className="text-lg animate-pulse">{message}</p>
        </div>
    );
};


export default function CombosPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { 'business-id': businessId, 'table-number': encodedTableNumber, category: categorySlug } = params as { 'business-id': string, 'table-number': string, category: string };
  const tableNumber = useMemo(() => decodeURIComponent(encodedTableNumber), [encodedTableNumber]);
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  
  const storageKey = `qrlive-cart-${businessId}-${tableNumber}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);


  useEffect(() => {
    try {
        const savedCart = localStorage.getItem(storageKey);
        if (savedCart) {
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
    async function fetchData() {
      if (typeof businessId !== 'string') return;
      setIsLoading(true);
      const { userId: fetchedUserId } = await getBusinessDataBySlug(businessId as string);
      if (fetchedUserId) {
        setUserId(fetchedUserId);
        const { combos } = await getMenuData(fetchedUserId);
        setCombos(combos);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [businessId]);

  const handleServiceRequest = async (requestType: string) => {
    if (!userId || typeof tableNumber !== 'string') return;

    setIsRequestingService(true);
    try {
        await submitServiceRequest(userId, tableNumber, requestType);
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
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== itemId);
      }
      return prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.finalPrice * item.quantity,
    0
  );


  const filteredItems = useMemo(() => {
    return combos.filter(combo => combo.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [combos, searchTerm]);

  const addToCart = (item: Combo, quantity = 1) => {
    setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
        if (existingItemIndex > -1) {
            const newCart = [...prevCart];
            newCart[existingItemIndex].quantity += quantity;
            return newCart;
        } else {
            return [...prevCart, { ...item, quantity, finalPrice: parseFloat(item.price || '0') }];
        }
    });
    toast({ title: `Added to cart!`, description: `${item.name} has been added to your order.` });
  };
  

  const aifaUrl = `/qrmenu/${businessId}/${encodedTableNumber}/aifa`;

  if (isLoading) {
    return <LoadingComponent />
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-950 to-black">
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-transparent shadow-lg">
        <header className="p-2 flex-shrink-0 bg-black/10 backdrop-blur-md sticky top-0 z-10 space-y-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button size="icon" onClick={() => router.back()} className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold capitalize text-white">Combos</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline" className="relative bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                            <ShoppingBag className="h-6 w-6" />
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">{cart.reduce((total, item) => total + item.quantity, 0)}</span>}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-w-[480px] mx-auto rounded-t-2xl p-0">
                        <SheetHeader className="p-4 text-left">
                        <SheetTitle>Your Order</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="px-4 h-[40vh]">
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">Your cart is empty.</div>
                        ) : (
                            <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center gap-4">
                                <Image src={(item as MenuItem).imageUrl || "https://picsum.photos/seed/combo/64/64"} alt={item.name} width={64} height={64} className="rounded-md object-cover"/>
                                <div className="flex-grow">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{format(item.finalPrice)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            </div>
                        )}
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
                            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                            </Button>
                        </div>
                        </SheetFooter>
                    </SheetContent>
                    </Sheet>
                    <Dialog open={isServiceRequestDialogOpen} onOpenChange={setIsServiceRequestDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                                <ConciergeBell className="h-6 w-6" />
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
                </div>
            </div>
             <div className="flex items-center gap-4 px-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input 
                    placeholder="Search for combos..." 
                    className="pl-10 bg-white/10 text-white placeholder:text-white/60 border-white/20 focus:border-white/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          <main className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden flex flex-col bg-white/10 backdrop-blur-lg border border-white/20"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={item.imageUrl || "https://picsum.photos/seed/combo/400/300"}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint="food combo"
                    />
                  </div>
                  <CardContent className="p-2 flex flex-col flex-grow">
                    <h3 className="font-semibold text-xs flex-grow leading-tight text-white">{item.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm text-white">
                        {format(Number(item.price))}
                      </span>
                      <Button
                        size="icon"
                        className="h-7 w-7 bg-white/20 text-white border-white/30 hover:bg-white/30"
                        onClick={() => addToCart(item)}
                      >
                         <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredItems.length === 0 && (
                <div className="text-center py-10 text-white/70">
                    <p>No combos found that match your search.</p>
                </div>
            )}
          </main>
        </ScrollArea>
        
        <div className="fixed bottom-4 right-4 z-20">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={aifaUrl}>
                            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={(e) => {
                                if(!userId) {
                                    e.preventDefault();
                                    toast({variant: 'destructive', title: 'AI Assistant Not Ready', description: 'Please wait a moment and try again.'})
                                }
                            }}>
                                <Bot className="h-7 w-7" />
                                <span className="sr-only">AI Food Assistant</span>
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-black/50 text-white border-white/20">
                        <p>Hi, I'm AIFA! Ask me for suggestions.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

    