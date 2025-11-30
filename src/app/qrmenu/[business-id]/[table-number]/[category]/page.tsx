
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getBusinessDataBySlug, getMenuData, type MenuItem, submitServiceRequest } from '@/lib/qrmenu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <SprayCan /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

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

  const addToCart = (item: any) => {
    // This is a placeholder. Cart logic would be centralized.
    console.log(`Added ${item.name} to cart.`);
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
            <Label htmlFor="veg-only">Veg Only</Label>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <main className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden flex flex-col"
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={item.imageHint}
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="font-semibold text-sm flex-grow">{item.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-base">
                        {format(Number(item.mrp || item.price))}
                      </span>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addToCart(item)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
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
