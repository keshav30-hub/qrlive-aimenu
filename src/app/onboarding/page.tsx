
'use client';

import { useState } from 'react';
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
import { Building, User, Phone, MapPin, FileText, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlacesAutocomplete } from '@/components/places-autocomplete';
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const handleCompleteOnboarding = async () => {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "User not authenticated. Please log in.",
        });
        return;
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!businessName || !ownerName || !contact || !address || !gst || !businessType) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out all required fields.",
        });
        return;
    }

    if (!gstRegex.test(gst.toUpperCase())) {
        toast({
            variant: "destructive",
            title: "Invalid GST Format",
            description: "Please enter a valid 15-character GST number.",
        });
        return;
    }

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        businessName,
        ownerName,
        contact,
        address: selectedPlace?.formatted_address || address,
        gst: gst.toUpperCase(),
        businessType,
        latitude: selectedPlace?.geometry?.location?.lat() || null,
        longitude: selectedPlace?.geometry?.location?.lng() || null,
        businessId: 'Menu-25-DFCV68',
        onboarding: true,
      }, { merge: true });
      
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
    setSelectedPlace(place);
    if (place) {
      setAddress(place.formatted_address || '');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to QRLive Menu</CardTitle>
          <CardDescription>
            Let's get your business set up. Please fill in the details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., The Gourmet Place" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-name">Owner Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g., John Doe" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile-number">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="mobile-number" 
                type="tel" 
                value={contact} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setContact(value);
                  }
                }} 
                placeholder="e.g., 9876543210" 
                className="pl-10"
                maxLength={10}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select a business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pub">Pub</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-address">Full Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <PlacesAutocomplete 
                onPlaceSelect={handlePlaceSelect} 
                defaultValue={address} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gst-detail">GST Detail</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="gst-detail" 
                value={gst} 
                onChange={(e) => setGst(e.target.value.toUpperCase())} 
                placeholder="Enter your 15-digit GST number" 
                className="pl-10"
                maxLength={15} 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCompleteOnboarding}>
            Complete Onboarding
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
