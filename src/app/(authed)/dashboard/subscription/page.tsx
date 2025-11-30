
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
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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

function PlanCard({ planId }: { planId: string }) {
    const { firestore } = useFirebase();
    const { format } = useCurrency();

    const planRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'plans', planId) : null),
        [firestore, planId]
    );
    
    const { data: plan, isLoading: planLoading } = useDoc<Plan>(planRef);

    if (planLoading) {
        return (
            <Card className="flex flex-col justify-between animate-pulse">
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
        );
    }

    if (!plan) {
        return null; // Don't render anything if the plan doesn't exist
    }

    return (
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
    );
}


export default function SubscriptionPage() {
  // Hardcode the plan IDs as per the new strategy
  const planIds = ['starter', 'pro', 'business'];

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
          {planIds.map(planId => <PlanCard key={planId} planId={planId} />)}
      </div>
    </div>
  );
}
