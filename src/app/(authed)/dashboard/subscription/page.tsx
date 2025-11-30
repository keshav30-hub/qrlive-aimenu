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
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useCurrency } from '@/hooks/use-currency';
import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Plan = {
  id: string;
  name: string;
  price: number;
  offerPrice?: number;
  razorpayPlanId: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
  ctaText?: string;
};

type UserSubscription = {
  planId: string;
  status: 'active' | 'inactive';
};

type OrderDetails = {
    orderId: string;
    amountINR: number;
    amountPaise: number;

    receipt: string;
    needsSetupFee: boolean;
};


export default function SubscriptionPage() {
  const { firestore, user } = useFirebase();
  const { format } = useCurrency();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const plansRef = useMemoFirebase(
    () => (user ? collection(firestore, 'plans') : null),
    [firestore, user]
  );
  
  const activePlansQuery = useMemoFirebase(
    () => (plansRef ? query(plansRef, where('isActive', '==', true), orderBy('displayOrder', 'asc')) : null),
    [plansRef]
  );

  const subscriptionRef = useMemoFirebase(
    () => (user ? doc(firestore, 'subscriptions', user.uid) : null),
    [user, firestore]
  );

  const { data: plansData, isLoading: plansLoading } = useCollection<Plan>(activePlansQuery);
  const { data: userSubscription, isLoading: subscriptionLoading } = useDoc<UserSubscription>(subscriptionRef);
  
  const loadRazorpayScript = () => {
    return new Promise(resolve => {
        if (document.getElementById('razorpay-checkout-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
  };

  const handlePurchase = async (plan: Plan) => {
    if (!user) return;
    setIsLoading(true);
    setSelectedPlan(plan);

    try {
        const functions = getFunctions(undefined, 'asia-south1');
        const createOrder = httpsCallable(functions, 'createOrder');

        const result: any = await createOrder({
            planId: plan.id,
            baseAmount: plan.offerPrice ?? plan.price,
        });
        
        setOrderDetails(result.data);
        setIsDialogOpen(true);

    } catch (error: any) {
        console.error('Error creating order:', error);
        toast({
            variant: 'destructive',
            title: 'Order Creation Failed',
            description: error.message || 'Could not create a payment order. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const proceedToPayment = async () => {
    if (!selectedPlan || !orderDetails || !user) return;

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast({
        variant: 'destructive',
        title: 'Payment Gateway Error',
        description: 'Could not load Razorpay. Please check your connection and try again.',
      });
      return;
    }
    
    setIsDialogOpen(false); // Close confirmation dialog
    setIsLoading(true);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderDetails.amountPaise,
      currency: "INR",
      name: "QRLive Menu",
      description: `Payment for ${selectedPlan.name} Plan`,
      order_id: orderDetails.orderId,
      handler: async (response: any) => {
        try {
            const functions = getFunctions(undefined, 'asia-south1');
            const verifyPayment = httpsCallable(functions, 'verifyPayment');
            await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan.id,
            });
            toast({
                title: 'Payment Successful!',
                description: `Your ${selectedPlan.name} plan is now active.`,
            });
        } catch (error: any) {
            console.error('Error verifying payment:', error);
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: error.message || 'Could not verify your payment.',
            });
        } finally {
            setIsLoading(false);
        }
      },
      prefill: {
        name: user.displayName || '',
        email: user.email || '',
        contact: user.phoneNumber || '',
      },
      theme: {
        color: '#0B2447',
      },
    };
    
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: response.error.description || 'Something went wrong.',
        });
        setIsLoading(false);
    });

    rzp.open();
  }


  const plans = (plansData || [])
    .map(plan => ({
      ...plan,
      isCurrent: userSubscription?.status === 'active' && userSubscription?.planId === plan.id,
      ctaText: userSubscription?.status === 'active' && userSubscription?.planId === plan.id ? 'Your Current Plan' : `Upgrade to ${plan.name}`,
    }));

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const basePrice = selectedPlan?.offerPrice ?? selectedPlan?.price ?? 0;
  const setupFee = orderDetails?.needsSetupFee ? 499 : 0; // Assuming 499, this should come from config in a real app

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Our Pricing Plans</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Choose the plan that's right for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {format(plan.offerPrice ?? plan.price)}
                  </span>
                  {plan.offerPrice && <span className="text-muted-foreground line-through">{format(plan.price)}</span>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={plan.isCurrent || isLoading} onClick={() => handlePurchase(plan)}>
                   {isLoading && selectedPlan?.id === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  {plan.name === 'Enterprise' ? 'Contact Sales' : plan.isCurrent ? 'Your Current Plan' : 'Buy Now'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
                <AlertDialogDescription>
                    Please review the details below before proceeding to payment.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4 text-sm">
                <div className="flex justify-between">
                    <span>{selectedPlan?.name} Plan</span>
                    <span className="font-medium">{format(basePrice)}</span>
                </div>
                 {orderDetails?.needsSetupFee && (
                    <div className="flex justify-between">
                        <span>One-time Setup Fee</span>
                        <span className="font-medium">{format(setupFee)}</span>
                    </div>
                )}
                <div className="border-t my-2"></div>
                <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{format(orderDetails?.amountINR || 0)}</span>
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOrderDetails(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={proceedToPayment}>Proceed to Payment</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
