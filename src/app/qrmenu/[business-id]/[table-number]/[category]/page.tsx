
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
import { getBusinessDataBySlug, getMenuData, type MenuItem, submitServiceRequest } from '@/lib/qrmenu';
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

type CartItem = MenuItem & { quantity: number; selectedModifiers: any; selectedAddons: any; finalPrice: number };


const ModifierDialog = ({ item, onAddToCart, open, setOpen }: { item: MenuItem; onAddToCart: (item: MenuItem, options: any) => void; open: boolean; setOpen: (open: boolean) => void; }) => {
    const { format } = useCurrency();
    const [selectedModifier, setSelectedModifier] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

    const basePrice = parseFloat(item.mrp || item.price || '0');

    const handleAddToCart = () => {
        const options = {
            selectedModifier,
            selectedAddons,
        };
        onAddToCart(item, options);
        setOpen(false);
    };
    
    useEffect(() => {
        if(open) {
            setSelectedModifier(null);
            setSelectedAddons([]);
        }
    }, [open]);

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>Customize your item before adding it to the cart.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                        {item.modifiers && item.modifiers.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Options</h4>
                                <RadioGroup onValueChange={(value) => setSelectedModifier(item.modifiers?.find(m => m.name === value))}>
                                    {item.modifiers.map(modifier => (
                                        <div key={modifier.name} className="flex items-center justify-between">
                                            <Label htmlFor={modifier.name} className="flex-1 cursor-pointer">{modifier.name} ({format(Number(modifier.price))})</Label>
                                            <RadioGroupItem value={modifier.name} id={modifier.name} />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold">Add-ons</h4>
                                {item.addons.map(addon => (
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
  const { 'business-id': businessId, 'table-number': tableNumber, category: categorySlug } = params;
  const categoryName = typeof categorySlug === 'string' ? categorySlug.replace(/-/g, ' ') : '';
  
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingService, setIsRequestingService] = useState(false);
  const [isServiceRequestDialogOpen, setIsServiceRequestDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedItemForDialog, setSelectedItemForDialog] = useState<MenuItem | null>(null);
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (typeof businessId !== 'string') return;
      const { userId: fetchedUserId } = await getBusinessDataBySlug(businessId as string);
      if (fetchedUserId) {
        setUserId(fetchedUserId);
        const { items } = await getMenuData(fetchedUserId);
        setMenuItems(items);
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
    return menuItems.filter(item => {
      const itemCategory = item.category.toLowerCase();
      const matchesCategory = itemCategory === categoryName;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !showVegOnly || item.type === 'veg';
      return matchesCategory && matchesSearch && matchesType;
    });
  }, [menuItems, categoryName, searchTerm, showVegOnly]);

  const handleAddToCartClick = (item: MenuItem) => {
    const hasOptions = (item.addons && item.addons.length > 0) || (item.modifiers && item.modifiers.length > 0);
    if (hasOptions) {
        setSelectedItemForDialog(item);
        setIsModifierDialogOpen(true);
    } else {
        addToCart(item, {});
    }
  };
  
  const addToCart = (item: MenuItem, options: { selectedModifier?: any, selectedAddons?: any[] }) => {
    toast({
        title: `Added to cart!`,
        description: `${item.name} has been added to your order.`,
    });
  };

  const aifaUrl = `/qrmenu/${businessId}/${tableNumber}/aifa`;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading dishes...</div>
  }

  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-black">
      <div className="max-w-[480px] mx-auto h-full flex flex-col bg-white dark:bg-gray-950 shadow-lg">
        <header className="p-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold capitalize">{categoryName}</h1>
          </div>
           <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="relative">
                <ShoppingBag className="h-6 w-6" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{cart.length}</span>}
            </Button>
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
              placeholder="Search for dishes..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="veg-only" checked={showVegOnly} onCheckedChange={setShowVegOnly} />
            <Label htmlFor="veg-only">Veg</Label>
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
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={item.imageHint}
                    />
                     <Badge className="absolute top-2 left-2" variant={item.type === 'veg' ? 'default' : 'destructive'}>
                        {item.type}
                     </Badge>
                  </div>
                  <CardContent className="p-2 flex flex-col flex-grow">
                    <h3 className="font-semibold text-xs flex-grow leading-tight">{item.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-sm">
                        {format(Number(item.mrp || item.price))}
                      </span>
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleAddToCartClick(item)}
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
                onAddToCart={addToCart}
                open={isModifierDialogOpen}
                setOpen={setIsModifierDialogOpen}
            />
        )}
        
        <div className="fixed bottom-4 right-1/2 translate-x-[calc(50vw-1rem)] max-w-[calc(480px-2rem)] w-full sm:translate-x-0 sm:right-4 sm:max-w-none sm:w-auto" style={{ right: 'calc(50% - 224px + 1rem)'}}>
             <Link href={aifaUrl}>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-7 w-7" />
                    <span className="sr-only">AI Food Assistant</span>
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
