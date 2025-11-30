
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
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

type Plan = {
  id: string;
  name: string;
  price: number;
  priceDescription: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
  ctaText?: string;
};

export default function SubscriptionPage() {
  const { firestore, user } = useFirebase();

  const plansRef = useMemoFirebase(() => (user ? collection(firestore, 'plans') : null), [firestore, user]);
  const { data: plansData, isLoading: plansLoading } = useCollection<Plan>(plansRef);

  // Assuming 'Free' is the default current plan for this logic.
  // This would be replaced with actual user subscription data later.
  const currentPlanName = 'Free';

  const plans = (plansData || [])
    .sort((a, b) => a.price - b.price)
    .map(plan => ({
      ...plan,
      isCurrent: plan.name === currentPlanName,
      ctaText: plan.name === currentPlanName ? 'Your Current Plan' : `Upgrade to ${plan.name}`,
    }));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Our Pricing Plans</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Choose the plan that's right for your business.
        </p>
      </div>

      {plansLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {plan.price > 0 ? `₹${plan.price}`: 'Free'}
                  </span>
                  {plan.priceDescription && <span className="text-muted-foreground">{plan.priceDescription}</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={plan.isCurrent}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.isCurrent ? 'Your Current Plan' : 'Buy Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

       <div className="text-center text-muted-foreground text-sm">
            <p>Need a custom solution? <Link href="/dashboard/settings" className="underline">Contact us</Link> for a personalized quote.</p>
       </div>
    </div>
  );
}
