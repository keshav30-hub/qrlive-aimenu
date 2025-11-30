
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const features = [
  'Unlimited Menu Items & Categories',
  'Advanced QR Menu Analytics',
  'AI Food Assistant (AIFA)',
  'Staff Management & Attendance',
  'Task & Service Request Management',
  'Dedicated Captain App',
  'Events & RSVP System',
  'Customer Feedback Tools',
  'Detailed Sales Reporting',
  '24/7 Support',
];

type Plan = {
    id: string;
    name: string;
    durationMonths: number;
    priceINR: number;
    offerPrice: number;
    recommended: boolean;
    sortOrder: number;
};

export default function SubscriptionPage() {
  const { firestore } = useFirebase();
  const { format } = useCurrency();

  const plansRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'plans') : null),
    [firestore]
  );
  const plansQuery = useMemoFirebase(
    () => (plansRef ? query(plansRef, orderBy('sortOrder')) : null),
    [plansRef]
  );
  
  const { data: plans, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCouponCode('');
    setDiscount(0);
    setIsDialogOpen(true);
  };
  
  const finalPrice = selectedPlan ? selectedPlan.offerPrice - discount : 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Subscription Plans</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Choose the plan duration that's right for your business.
        </p>
      </div>

       <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-2xl text-center">All Features Included</CardTitle>
          <CardDescription className="text-center">
            Every plan unlocks the full power of QRLive Menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plansLoading && (
              [...Array(3)].map((_, i) => (
                  <Card key={i} className="flex flex-col justify-between animate-pulse">
                      <CardHeader>
                          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-10 bg-gray-200 rounded w-1/2 mt-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 mt-1"></div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                          <div className="space-y-3">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                      </CardContent>
                      <CardFooter>
                          <div className="h-10 bg-gray-200 rounded w-full"></div>
                      </CardFooter>
                  </Card>
              ))
          )}
          {!plansLoading && plans && plans.map(plan => (
               <Card key={plan.id} className={cn("flex flex-col", plan.recommended && "border-primary border-2 shadow-lg")}>
                  <CardHeader>
                  {plan.recommended && (
                      <Badge className="absolute -top-3 right-4">Recommended</Badge>
                  )}
                  <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{format(plan.offerPrice)}</span>
                      {plan.priceINR > plan.offerPrice && <span className="text-muted-foreground line-through">{format(plan.priceINR)}</span>}
                  </div>
                  <CardDescription>{plan.durationMonths} month access</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                      <li>Renews at {format(plan.offerPrice)} every {plan.durationMonths} months.</li>
                      <li>Cancel anytime.</li>
                  </ul>
                  </CardContent>
                  <CardFooter>
                  <Button className="w-full" onClick={() => handleSelectPlan(plan)}>
                      Choose Plan
                  </Button>
                  </CardFooter>
              </Card>
          ))}
      </div>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Your Subscription</DialogTitle>
                    <DialogDescription>
                        You are about to subscribe to the <span className="font-semibold capitalize">{selectedPlan?.name}</span> for {selectedPlan?.durationMonths} months.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Base Price</span>
                        <span className="font-medium">{selectedPlan ? format(selectedPlan.offerPrice) : ''}</span>
                    </div>
                     {discount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                            <span className="text-muted-foreground">Coupon Discount</span>
                            <span className="font-medium">- {format(discount)}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="coupon"
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                            />
                            <Button variant="outline">Apply</Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Payable</span>
                        <span>{format(finalPrice)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button>
                        Subscribe
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
