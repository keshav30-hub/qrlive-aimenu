
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
import { Label } from '@/components/ui/label';
import { Building, User, Phone, MapPin, FileText, Briefcase, LogOut, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { useFirebase, useFirebaseStorage } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { signOut } from 'firebase/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState } from 'react';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const onboardingSchema = z.object({
  businessName: z.string().min(1, { message: 'Business name is required' }),
  ownerName: z.string().min(1, { message: 'Owner name is required' }),
  contact: z.string().length(10, { message: 'Mobile number must be 10 digits' }),
  businessType: z.string().min(1, { message: 'Please select a business type' }),
  address: z.string().min(1, { message: 'Full Address is required' }),
  gst: z.string().regex(gstRegex, { message: 'Invalid GST number format' }),
  logo: z.string().optional(),
  logoStoragePath: z.string().optional(),
  instagramLink: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
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
  const { uploadFile, isLoading: isUploading } = useFirebaseStorage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      contact: '',
      businessType: '',
      address: '',
      gst: '',
      logo: '',
      logoStoragePath: '',
      instagramLink: '',
      latitude: null,
      longitude: null,
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
        const file = e.target.files[0];
        const newPath = `users/${user.uid}/images/logo/${Date.now()}_${file.name}`;
        
        const uploadResult = await uploadFile(newPath, file);

        if (uploadResult) {
            form.setValue('logo', uploadResult.downloadURL);
            form.setValue('logoStoragePath', uploadResult.storagePath);
            setImagePreview(uploadResult.downloadURL);
            toast({ title: 'Logo Uploaded', description: 'Your business logo is ready.' });
        } else {
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload logo.' });
        }
    }
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

      await updateDoc(userRef, {
        businessName: data.businessName,
        ownerName: data.ownerName,
        contact: data.contact,
        address: data.address,
        gst: data.gst,
        businessType: data.businessType,
        logo: data.logo || `https://ui-avatars.com/api/?name=${data.businessName.charAt(0)}&color=7F9CF5&background=EBF4FF`,
        logoStoragePath: data.logoStoragePath,
        instagramLink: data.instagramLink,
        latitude: data.latitude,
        longitude: data.longitude,
        businessId: businessId,
        onboarding: true,
      });

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
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={imagePreview || undefined} alt="Business Logo" />
                  <AvatarFallback>
                    {form.getValues('businessName')?.charAt(0) || <Building />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="logo">Business Logo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} disabled={isUploading || isSubmitting}/>
                  {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                </div>
              </div>
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
              <FormField
                control={form.control}
                name="instagramLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Instagram Link (Optional)</FormLabel>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Instagram</title><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.936 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.314.936 20.647.525 19.86.22c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381-.896-.422.164-1.057.36-2.227.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249-1.805.413-2.227.217-.562.477.96.896-1.381.42-.419.819.679 1.381-.896.422-.164 1.057.36 2.227-.413C8.415 2.175 8.797 2.16 12 2.16zm0 4.88c-1.996 0-3.6,1.604-3.6,3.6s1.604,3.6 3.6,3.6 3.6-1.604 3.6-3.6-1.604-3.6-3.6-3.6zm0 5.95c-1.303 0-2.35-1.047-2.35-2.35s1.047-2.35 2.35-2.35 2.35,1.047 2.35,2.35-1.047,2.35-2.35,2.35zm5.517-6.91c-.53 0-.96.43-.96.96s.43.96.96.96.96-.43.96-.96-.43-.96-.96-.96z"/></svg>
                        <FormControl>
                          <Input placeholder="https://instagram.com/your-business" className="pl-10 bg-gray-50 border-gray-300 text-gray-900" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-gray-800 text-white hover:bg-gray-700" disabled={isSubmitting || isUploading}>
                {isSubmitting || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isSubmitting ? 'Completing...' : 'Complete Onboarding'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

    