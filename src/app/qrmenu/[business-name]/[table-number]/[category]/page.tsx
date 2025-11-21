
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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/use-currency';
import {
  Star,
  Flame,
  Bell,
  ChevronLeft,
  Search,
  ConciergeBell,
  FileText,
  Sparkles,
  GlassWater,
  SprayCan,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { menu } from '@/lib/qrmenu-mock';


const getTagIcon = (tag: string) => {
  switch (tag) {
    case 'bestseller':
      return <Star className="h-3 w-3" />;
    case 'healthy':
      return <Flame className="h-3 w-3" />;
    default:
      return null;
  }
};

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
  const { 'business-name': businessName, 'table-number': tableNumber } = params;
  const categoryName = params.category ? (params.category as string).replace(/-/g, ' ') : '';
  
  const { format } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  // In a real app, you'd manage a global cart state (e.g., with Context or Zustand)
  const [cart, setCart] = useState<any[]>([]);

  const filteredItems = useMemo(() => {
    return menu.items.filter(item => {
      const itemCategory = item.category.toLowerCase().replace(/ /g, '-');
      const matchesCategory = itemCategory === params.category;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !showVegOnly || item.type === 'veg';
      return matchesCategory && matchesSearch && matchesType;
    });
  }, [params.category, searchTerm, showVegOnly]);

  const addToCart = (item: any) => {
    // This is a placeholder. Cart logic would be centralized.
    console.log(`Added ${item.name} to cart.`);
  };

  const aifaUrl = `/qrmenu/${businessName}/${tableNumber}/aifa`;

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen">
      <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-950 shadow-lg relative pb-24">
        <header className="p-4 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold capitalize">{categoryName}</h1>
          </div>
          <Dialog>
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
                        <Button key={req.text} variant="outline" className="flex-grow h-16 flex-col gap-1">
                            {req.icon}
                            <span>{req.text}</span>
                        </Button>
                    ))}
                 </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-4 flex items-center gap-4 sticky top-[72px] bg-white dark:bg-gray-950 z-10">
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

        <main className="p-4 pt-0">
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="flex gap-4 overflow-hidden"
              >
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={item.imageHint}
                  />
                </div>
                <div className="flex-grow p-3 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge
                      variant={
                        item.type === 'veg' ? 'secondary' : 'destructive'
                      }
                      className="capitalize h-5"
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex-grow line-clamp-2 mt-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {item.kcal} kcal
                    {item.tags.length > 0 && <Separator orientation='vertical' className='h-3' />}
                    <div className='flex gap-2'>
                        {item.tags.map(tag => (
                            <div key={tag} className="flex items-center gap-1 capitalize">
                                {getTagIcon(tag)} {tag}
                            </div>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-lg">
                      {format(Number(item.price))}
                    </span>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => addToCart(item)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
             {filteredItems.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No dishes found that match your search.</p>
                </div>
            )}
          </div>
        </main>
        
        <div className="fixed bottom-4 right-4 z-20">
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

    