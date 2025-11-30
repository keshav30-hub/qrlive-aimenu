
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/use-currency';
import {
  Bell,
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
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessDataBySlug, getMenuData, type MenuItem, submitServiceRequest, type Combo } from '@/lib/qrmenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';


const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

type CartItem = (MenuItem | Combo) & { quantity: number; selectedModifiers?: any; selectedAddons?: any[]; finalPrice: number };


export default function CombosPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { 'business-id': businessId, 'table-number': tableNumber, category: categorySlug } = params as { 'business-id': string, 'table-number': string, category: string };
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  
  const storageKey = `qrlive-cart-${businessId}-${tableNumber}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
        const savedCart = localStorage.getItem(storageKey);
        return savedCart ? JSON.parse(savedCart) : [];
    } catch {
        return [];
    }
  });

  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
  

  const aifaUrl = `/qrmenu/${businessId}/${tableNumber}/aifa`;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading combos...</div>
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-black">
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
        <header className="p-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold capitalize">Combos</h1>
          </div>
           <div className="flex items-center gap-2">
            <Link href={`/qrmenu/${businessId}/${tableNumber}`}>
                <Button size="icon" variant="outline" className="relative">
                    <ShoppingBag className="h-6 w-6" />
                    {cart.length > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{cart.reduce((total, item) => total + item.quantity, 0)}</span>}
                </Button>
            </Link>
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
          </div>
        </header>

        <div className="p-4 flex items-center gap-4 sticky top-[72px] bg-white dark:bg-gray-950 z-10 border-b">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for combos..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <main className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden flex flex-col"
                >
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={"https://picsum.photos/seed/combo/400/300"}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint="food combo"
                    />
                  </div>
                  <CardContent className="p-2 flex flex-col flex-grow">
                    <h3 className="font-semibold text-xs flex-grow leading-tight">{item.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm">
                        {format(Number(item.price))}
                      </span>
                      <Button
                        size="icon"
                        className="h-7 w-7"
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
                <div className="text-center py-10 text-muted-foreground">
                    <p>No combos found that match your search.</p>
                </div>
            )}
          </main>
        </ScrollArea>
        
        <div className="fixed bottom-4" style={{ right: 'max(1rem, 50% - 224px + 1rem)'}}>
             <Link href={aifaUrl}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-7 w-7 animate-sparkle" />
                    <span className="sr-only">AI Food Assistant</span>
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
