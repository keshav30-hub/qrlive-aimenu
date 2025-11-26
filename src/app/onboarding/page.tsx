
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, User, Phone, MapPin, FileText, Briefcase, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { useFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signOut } from 'firebase/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const onboardingSchema = z.object({
  businessName: z.string().min(1, { message: 'Business name is required' }),
  ownerName: z.string().min(1, { message: 'Owner name is required' }),
  contact: z.string().length(10, { message: 'Mobile number must be 10 digits' }),
  businessType: z.string().min(1, { message: 'Please select a business type' }),
  address: z.string().min(1, { message: 'Full Address is required' }),
  gst: z.string().regex(gstRegex, { message: 'Invalid GST number format' }),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

function generateBusinessId() {
    const year = new Date().getFullYear().toString().slice(-2);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Menu-${year}-${randomPart}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      contact: '',
      businessType: '',
      address: '',
      gst: '',
      latitude: null,
      longitude: null,
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const onSubmit = async (data: OnboardingFormData) => {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "User not authenticated. Please log in.",
        });
        return;
    }

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const businessId = generateBusinessId();

      // Step 1: Update the private user document
      await updateDoc(userRef, {
        businessName: data.businessName,
        ownerName: data.ownerName,
        contact: data.contact,
        address: data.address,
        gst: data.gst,
        businessType: data.businessType,
        latitude: data.latitude,
        longitude: data.longitude,
        businessId: businessId,
        onboarding: true,
      });

      // Step 2: Create the public business mapping document
      const businessRef = doc(firestore, 'businesses', businessId);
      await setDoc(businessRef, {
        ownerUid: user.uid,
      });
      
      toast({
        title: "Onboarding Complete!",
        description: "Welcome to your dashboard.",
      });

      router.push('/dashboard');
    } catch (error) {
        console.error("Error saving onboarding data:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save your information. Please try again.",
        });
    }
  };
  
  const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
    if (place) {
      // Construct a more detailed address string
      let detailedAddress = place.name;
      if (place.formatted_address && !place.formatted_address.startsWith(place.name || '')) {
          detailedAddress = `${place.name}, ${place.formatted_address}`;
      } else if (place.formatted_address) {
          detailedAddress = place.formatted_address;
      }
      
      form.setValue('address', detailedAddress, { shouldValidate: true });
      form.setValue('latitude', place.geometry?.location?.lat() || null);
      form.setValue('longitude', place.geometry?.location?.lng() || null);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg relative bg-white text-gray-800">
        <CardHeader>
           <div className="flex justify-between items-start">
             <div>
                <CardTitle className="text-2xl text-gray-900">Welcome to QRLive Menu</CardTitle>
                <CardDescription className="text-gray-600">
                    Let's get your business set up. Please fill in the details below.
                </CardDescription>
             </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="absolute top-4 right-4 text-gray-500 hover:bg-gray-200">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
           </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Business Name</FormLabel>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input placeholder="e.g., The Gourmet Place" className="pl-10 bg-gray-50 border-gray-300 text-gray-900" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Owner Name</FormLabel>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input placeholder="e.g., John Doe" className="pl-10 bg-gray-50 border-gray-300 text-gray-900" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Mobile Number</FormLabel>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="e.g., 9876543210" 
                            className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                            maxLength={10}
                            {...field}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  field.onChange(value);
                                }
                            }}
                          />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Business Type</FormLabel>
                     <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="pl-10 bg-gray-50 border-gray-300 text-gray-900">
                                    <SelectValue placeholder="Select a business type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="cafe">Cafe</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                                <SelectItem value="bar">Bar</SelectItem>
                                <SelectItem value="pub">Pub</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Full Address</FormLabel>
                    <FormControl>
                        <PlacesAutocomplete
                          onPlaceSelect={handlePlaceSelect}
                          value={field.value}
                          onValueChange={(value) => form.setValue('address', value, { shouldValidate: true })}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gst"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">GST Detail</FormLabel>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input 
                            placeholder="Enter your 15-digit GST number" 
                            className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                            maxLength={15} 
                            {...field}
                             onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-gray-800 text-white hover:bg-gray-700" disabled={isSubmitting}>
                {isSubmitting ? 'Completing...' : 'Complete Onboarding'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
