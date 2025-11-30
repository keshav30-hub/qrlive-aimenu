
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
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, DocumentData, doc } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { validateCoupon } from '@/lib/firebase/coupons';
import { RAZORPAY_KEY_ID } from '@/lib/config';

const features = [
  'Unlimited Menu Items & Categories',
  'Advanced QR Menu Analytics',
  'AI Food Assistant (AIFA)',
  'Staff Management & Attendance',
  'Dedicated Captain App',
  'Task & Service Request Management',
  'Events & RSVP System',
  'Customer Feedback Tools',
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

type UserProfile = {
  email?: string;
  contact?: string;
  businessName?: string;
}

export default function SubscriptionPage() {
  const { firestore, user } = useFirebase();
  const { format } = useCurrency();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userRef);

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
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<DocumentData | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    setIsDialogOpen(true);
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setIsApplyingCoupon(true);
    setDiscount(0);
    setAppliedCoupon(null);

    try {
      const result = await validateCoupon(couponCode, selectedPlan.id);
      
      if (!result.isValid) {
        toast({
          variant: 'destructive',
          title: 'Invalid Coupon',
          description: result.message,
        });
        return;
      }
      
      let calculatedDiscount = 0;
      if (result.coupon.type === 'percentage') {
        calculatedDiscount = (selectedPlan.offerPrice * result.coupon.value) / 100;
      } else { // flat discount
        calculatedDiscount = result.coupon.value;
      }

      setDiscount(calculatedDiscount);
      setAppliedCoupon(result.coupon);

      toast({
        title: 'Coupon Applied!',
        description: `You saved ${format(calculatedDiscount)}.`,
      });

    } catch (error) {
      console.error("Coupon application error:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not apply coupon. Please try again.',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Plan or user details are missing.'});
      return;
    }
    
    setIsSubscribing(true);

    const finalAmount = selectedPlan.offerPrice - discount;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: finalAmount * 100, // Amount in paise
      currency: "INR",
      name: selectedPlan.name,
      description: `QRLive Menu - ${selectedPlan.durationMonths} Month Subscription`,
      handler: function (response: any) {
        toast({ title: 'Payment Successful', description: `Payment ID: ${response.razorpay_payment_id}`});
        // Here you would typically save the subscription details to your database
        // e.g., createSubscription(user.uid, selectedPlan.id, response.razorpay_payment_id);
        setIsDialogOpen(false);
      },
      prefill: {
        name: userProfile.businessName,
        email: userProfile.email,
        contact: userProfile.contact,
      },
      notes: {
        plan_id: selectedPlan.id,
        user_id: user?.uid,
        coupon_applied: appliedCoupon?.code || 'None',
      },
      theme: {
        color: "#0f172a"
      },
      modal: {
        ondismiss: function() {
            setIsSubscribing(false);
        }
      }
    };
    
    // @ts-ignore
    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response: any){
        toast({ variant: 'destructive', title: 'Payment Failed', description: response.error.description });
        setIsSubscribing(false);
    });

    rzp.open();
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
          {!plansLoading && plans && plans.map(plan => {
              const priceToUse = plan.offerPrice > 0 ? plan.offerPrice : plan.priceINR;
              const perDayCost = Math.floor(priceToUse / (plan.durationMonths * 30));

              return (
               <Card key={plan.id} className={cn("flex flex-col", plan.recommended && "border-primary border-2")}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                        {plan.recommended && <Badge>Recommended</Badge>}
                    </div>
                    <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-4xl font-bold">{format(plan.offerPrice)}</span>
                        {plan.priceINR > plan.offerPrice && <span className="text-muted-foreground line-through">{format(plan.priceINR)}</span>}
                    </div>
                    <CardDescription>{plan.durationMonths} month access</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                  <div className='p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-center mb-4'>
                      <p className='text-lg font-bold text-green-700 dark:text-green-300'>{format(perDayCost)}/day</p>
                      {plan.offerPrice > 0 && <p className='text-xs text-green-600 dark:text-green-400'>(Based on offer price)</p>}
                  </div>
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
          )})}
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
                            <span className="text-muted-foreground">Coupon Discount ({appliedCoupon?.code})</span>
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
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                disabled={isApplyingCoupon}
                            />
                            <Button variant="outline" onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode}>
                               {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                               Apply
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Payable</span>
                        <span>{format(finalPrice)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubscribing}>Cancel</Button>
                    <Button onClick={handleSubscribe} disabled={isSubscribing}>
                        {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubscribing ? 'Processing...' : 'Subscribe'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
