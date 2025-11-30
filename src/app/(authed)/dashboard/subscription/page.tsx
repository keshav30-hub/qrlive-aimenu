
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
import { Check } from 'lucide-react';
import Link from 'next/link';

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

const plans = [
  {
    name: 'Free',
    price: '₹0',
    priceDescription: '/month',
    description: 'For individuals and small teams just getting started.',
    features: [
      'Up to 25 menu items',
      'Basic QR menu analytics',
      'Community support',
    ],
    cta: 'Your Current Plan',
    disabled: true,
  },
  {
    name: 'Pro',
    price: '₹2499',
    priceDescription: '/month',
    description: 'For growing businesses that need more power and support.',
    features: [
      'Unlimited menu items',
      'Advanced analytics & reports',
      'AI Food Assistant (AIFA)',
      'Staff management tools',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    disabled: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceDescription: '',
    description: 'For large-scale operations with custom requirements.',
    features: [
      'Everything in Pro, plus:',
      'Dedicated account manager',
      'Custom integrations',
      'On-premise options',
      '24/7 phone support',
    ],
    cta: 'Contact Sales',
    disabled: false,
  },
];

export default function SubscriptionPage() {
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
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.priceDescription && <span className="text-muted-foreground">{plan.priceDescription}</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
               <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={plan.disabled}>
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center text-muted-foreground text-sm">
            <p>Need a custom solution? <Link href="/contact" className="underline">Contact us</Link> for a personalized quote.</p>
       </div>
    </div>
  );
}
