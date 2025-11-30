
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

const features = [
  'Unlimited Menu Items & Categories',
  'Advanced QR Menu Analytics',
  'AI Food Assistant (AIFA)',
  'Staff Management & Attendance',
  'Task & Service Request Management',
  'Events & RSVP System',
  'Customer Feedback Tools',
  'Priority Support'
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
  
  const { data: plansData, isLoading: plansLoading } = useCollection<Plan>(plansQuery);
  const plans = plansData || [];

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

      {plansLoading ? (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn("flex flex-col", plan.recommended && "border-primary border-2 shadow-lg")}>
              <CardHeader>
                {plan.recommended && (
                    <Badge className="absolute -top-3 right-4">Recommended</Badge>
                )}
                <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{format(plan.offerPrice)}</span>
                  <span className="text-muted-foreground line-through">{format(plan.priceINR)}</span>
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
                <Button className="w-full">
                  Choose Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
