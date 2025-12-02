
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
  Minus,
  Trash2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessDataBySlug, getMenuData, type MenuItem, submitServiceRequest, type Combo } from '@/lib/qrmenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { trackMenuItemView, trackWaiterCall } from '@/lib/gtag';


const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

type CartItem = (MenuItem | Combo) & { quantity: number; selectedModifiers?: any; selectedAddons?: any[]; finalPrice: number };


const ModifierDialog = ({ item, onAddToCart, open, setOpen }: { item: MenuItem; onAddToCart: (item: CartItem) => void; open: boolean; setOpen: (open: boolean) => void; }) => {
    const { format } = useCurrency();
    const [selectedModifier, setSelectedModifier] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

    const basePrice = parseFloat(item.mrp || item.price || '0');

    const handleAddToCart = () => {
        const finalPrice = calculateTotalPrice();
        onAddToCart({
            ...item,
            quantity: 1, // Always add one at a time from dialog
            selectedModifier,
            selectedAddons,
            finalPrice
        });
        setOpen(false);
    };
    
    useEffect(() => {
        if(open) {
            trackMenuItemView(item.name);
            setSelectedModifier(null);
            setSelectedAddons([]);
        }
    }, [open, item.name]);

    const calculateTotalPrice = () => {
        let total = basePrice;
        if (selectedModifier) {
            total = parseFloat(selectedModifier.price);
        }
        selectedAddons.forEach(addon => {
            total += parseFloat(addon.price);
        });
        return total;
    };

    const handleAddonToggle = (addon: any, checked: boolean) => {
        setSelectedAddons(prev => 
            checked ? [...prev, addon] : prev.filter(a => a.name !== addon.name)
        );
    };

    const hasModifiers = item.modifiers && item.modifiers.length > 0 && item.modifiers.some(m => m.name && m.price);
    const hasAddons = item.addons && item.addons.length > 0 && item.addons.some(a => a.name && a.price);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>Customize your item before adding it to the cart.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                        {hasModifiers && (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Options</h4>
                                <RadioGroup onValueChange={(value) => setSelectedModifier(item.modifiers?.find(m => m.name === value))}>
                                    {item.modifiers?.map(modifier => (
                                        modifier.name && modifier.price &&
                                        <div key={modifier.name} className="flex items-center justify-between">
                                            <Label htmlFor={modifier.name} className="flex-1 cursor-pointer">{modifier.name} ({format(Number(modifier.price))})</Label>
                                            <RadioGroupItem value={modifier.name} id={modifier.name} />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                        {hasAddons && (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Add-ons</h4>
                                {item.addons?.map(addon => (
                                    addon.name && addon.price &&
                                    <div key={addon.name} className="flex items-center justify-between">
                                        <Label htmlFor={addon.name} className="flex-1 cursor-pointer">{addon.name} (+{format(Number(addon.price))})</Label>
                                        <Checkbox id={addon.name} onCheckedChange={(checked) => handleAddonToggle(addon, !!checked)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={handleAddToCart} className="w-full">
                        Add to Cart ({format(calculateTotalPrice())})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function CategoryMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { 'business-id': businessId, 'table-number': tableNumber, category: categorySlug } = params as { 'business-id': string, 'table-number': string, category: string };
  const isComboPage = categorySlug === 'combos';
  const categoryName = isComboPage ? 'Combos' : categorySlug.replace(/-/g, ' ');
  
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  
  const storageKey = `qrlive-cart-${businessId}-${tableNumber}`;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [selectedItemForDialog, setSelectedItemForDialog] = useState<MenuItem | null>(null);
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);

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
        const { items, combos } = await getMenuData(fetchedUserId);
        setMenuItems(items);
        setCombos(combos);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [businessId]);

  const handleServiceRequest = async (requestType: string) => {
    if (!userId || typeof tableNumber !== 'string') return;

    setIsRequestingService(true);
    trackWaiterCall(requestType);
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
    const orderSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const requestType = `New Order: ${orderSummary}`;
    trackWaiterCall('Place Order');
    try {
      await submitServiceRequest(userId, tableNumber, requestType);
      toast({
        title: 'Order Placed!',
        description: 'Your order has been sent to the kitchen. A staff member will confirm it shortly.',
      });
      setCart([]);
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
    if (isComboPage) {
        return combos.filter(combo => combo.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return menuItems.filter(item => {
      const itemCategory = item.category.toLowerCase();
      const matchesCategory = itemCategory === categoryName;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !showVegOnly || item.type === 'veg';
      return matchesCategory && matchesSearch && matchesType;
    });
  }, [menuItems, combos, categoryName, searchTerm, showVegOnly, isComboPage]);

  const addToCart = (item: MenuItem, quantity = 1) => {
    setCart(prevCart => {
        // Find item that doesn't have custom modifiers/addons
        const existingItem = prevCart.find(cartItem => cartItem.id === item.id && !cartItem.selectedModifier && (!cartItem.selectedAddons || cartItem.selectedAddons.length === 0));
        if (existingItem) {
            return prevCart.map(cartItem => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem);
        } else {
            return [...prevCart, { ...item, quantity, finalPrice: parseFloat(item.mrp || item.price || '0') }];
        }
    });
    toast({ title: `Added to cart!`, description: `${item.name} has been added to your order.` });
  };
  
  const addCustomizedToCart = (item: CartItem) => {
     setCart(prevCart => [...prevCart, item]);
     toast({ title: `Added to cart!`, description: `${item.name} has been added to your order.` });
  }

  const handleAddToCartClick = (item: MenuItem) => {
    const hasModifiers = item.modifiers && item.modifiers.length > 0 && item.modifiers.some(m => m.name && m.price);
    const hasAddons = item.addons && item.addons.length > 0 && item.addons.some(a => a.name && a.price);

    if (hasModifiers || hasAddons) {
        setSelectedItemForDialog(item);
        setIsModifierDialogOpen(true);
    } else {
        addToCart(item);
    }
  };

  const aifaUrl = `/qrmenu/${businessId}/${tableNumber}/aifa`;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading dishes...</div>
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-black">
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
        <header className="px-4 py-2 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-2">
            <Button size="icon" onClick={() => router.back()} className="bg-primary text-primary-foreground">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold capitalize">{categoryName}</h1>
          </div>
           <div className="flex items-center gap-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="relative">
                        <ShoppingBag className="h-6 w-6" />
                        {cart.length > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{cart.reduce((total, item) => total + item.quantity, 0)}</span>}
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
                        {cart.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex items-center gap-4">
                            <Image src={(item as MenuItem).imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover"/>
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

        <div className="px-4 py-2 flex items-center gap-4 sticky top-[64px] bg-white dark:bg-gray-950 z-10 border-b">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for dishes..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isComboPage && (
            <div className="flex items-center space-x-2">
                <Switch id="veg-only" checked={showVegOnly} onCheckedChange={setShowVegOnly} />
                <Label htmlFor="veg-only">Veg</Label>
            </div>
          )}
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
                      src={(item as MenuItem).imageUrl || "https://picsum.photos/seed/combo/400/300"}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={(item as MenuItem).imageHint}
                    />
                  </div>
                  <CardContent className="p-2 flex flex-col flex-grow">
                    <div className="flex items-center gap-2">
                        {!isComboPage && <div className={`h-3 w-3 rounded-full border flex-shrink-0 ${(item as MenuItem).type === 'veg' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'}`}></div>}
                        <h3 className="font-semibold text-xs flex-grow leading-tight">{item.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm">
                        {format(Number((item as MenuItem).mrp || item.price))}
                      </span>
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleAddToCartClick(item as MenuItem)}
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
                    <p>No dishes found that match your search.</p>
                </div>
            )}
          </main>
        </ScrollArea>
        
        {selectedItemForDialog && (
            <ModifierDialog 
                item={selectedItemForDialog} 
                onAddToCart={addCustomizedToCart}
                open={isModifierDialogOpen}
                setOpen={setIsModifierDialogOpen}
            />
        )}
        
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
            <div className="z-50 overflow-hidden rounded-md border bg-background/30 backdrop-blur-md px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                <p>Hi, I'm AIFA! Ask me for suggestions.</p>
            </div>
            <Link href={aifaUrl}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground"
                onClick={(e) => {
                    if(!userId) {
                        e.preventDefault();
                        toast({variant: 'destructive', title: 'AI Assistant Not Ready', description: 'Please wait a moment and try again.'})
                    }
                }}>
                    <Sparkles className="h-7 w-7 animate-sparkle" />
                    <span className="sr-only">AI Food Assistant</span>
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
