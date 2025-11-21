'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  SheetTrigger,
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
  Star,
  Flame,
  Bell,
  ConciergeBell,
  FileText,
  Sparkles,
  GlassWater,
  Spray,
} from 'lucide-react';
import { useState } from 'react';


const businessData = {
  name: 'The Gourmet Place',
  logo: 'https://picsum.photos/seed/logo/100/100',
};

const events = [
  {
    id: '1',
    name: 'Jazz Night',
    description: 'Enjoy a relaxing evening with live jazz music.',
    imageUrl: 'https://picsum.photos/seed/event1/600/400',
    imageHint: 'jazz band',
  },
  {
    id: '3',
    name: 'Wine Tasting',
    description: 'Explore a selection of fine wines.',
    imageUrl: 'https://picsum.photos/seed/event3/600/400',
    imageHint: 'wine glasses',
  },
];

const menu = {
  categories: [
    { name: 'Appetizers' },
    { name: 'Main Course' },
    { name: 'Desserts' },
    { name: 'Beverages' },
  ],
  items: [
    {
      id: '1',
      name: 'Margherita Pizza',
      category: 'Main Course',
      price: '250',
      type: 'veg',
      description:
        'A classic pizza with fresh mozzarella, tomatoes, and basil.',
      kcal: '750',
      imageUrl: 'https://picsum.photos/seed/item1/400/300',
      imageHint: 'margherita pizza',
      tags: ['bestseller'],
    },
    {
      id: '2',
      name: 'Chicken Burger',
      category: 'Main Course',
      price: '180',
      type: 'non-veg',
      description:
        'A juicy chicken patty with lettuce, tomato, and our special sauce.',
      kcal: '550',
      imageUrl: 'https://picsum.photos/seed/item2/400/300',
      imageHint: 'chicken burger',
      tags: [],
    },
    {
      id: '3',
      name: 'Caesar Salad',
      category: 'Appetizers',
      price: '150',
      type: 'veg',
      description: 'Crisp romaine lettuce with croutons and parmesan cheese.',
      kcal: '350',
      imageUrl: 'https://picsum.photos/seed/item3/400/300',
      imageHint: 'caesar salad',
      tags: ['healthy'],
    },
    {
      id: '4',
      name: 'Chocolate Lava Cake',
      category: 'Desserts',
      price: '120',
      type: 'veg',
      description: 'Warm chocolate cake with a gooey molten center.',
      kcal: '450',
      imageUrl: 'https://picsum.photos/seed/item4/400/300',
      imageHint: 'lava cake',
      tags: ['bestseller'],
    },
    {
      id: '5',
      name: 'Mojito',
      category: 'Beverages',
      price: '90',
      type: 'veg',
      description: 'A refreshing mix of mint, lime, and soda.',
      kcal: '150',
      imageUrl: 'https://picsum.photos/seed/item5/400/300',
      imageHint: 'mojito drink',
      tags: [],
    },
  ],
};

const getTagIcon = (tag: string) => {
  switch (tag) {
    case 'bestseller':
      return <Star className="h-3 w-3" />;
    case 'healthy':
      return <Flame className="h-3 w-3" />; // Using Flame for 'healthy'
    default:
      return null;
  }
};

const serviceRequests = [
    { text: 'Get Bill', icon: <FileText /> },
    { text: 'Call Captain', icon: <ConciergeBell /> },
    { text: 'Get Tissues', icon: <Sparkles /> },
    { text: 'Clean the Table', icon: <Spray /> },
    { text: 'Get Water', icon: <GlassWater /> },
]

export default function QrMenuPage() {
  const params = useParams();
  const { 'business-name': businessName, 'table-number': tableNumber } = params;
  const { format } = useCurrency();
  const [cart, setCart] = useState<any[]>([]);

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
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen">
      <div className="max-w-[480px] mx-auto bg-white dark:bg-gray-950 shadow-lg">
        <header className="p-4 flex justify-between items-center">
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

        <section className="px-4 pb-4">
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
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        <main>
          <Tabs defaultValue={menu.categories[0].name} className="w-full">
            <TabsList className="mx-4">
              {menu.categories.map((category) => (
                <TabsTrigger key={category.name} value={category.name}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {menu.categories.map((category) => (
              <TabsContent key={category.name} value={category.name}>
                <div className="space-y-4 p-4">
                  {menu.items
                    .filter((item) => item.category === category.name)
                    .map((item) => (
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
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>

        {cart.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <div className="sticky bottom-4 px-4 z-10">
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
      </div>
    </div>
  );
}
