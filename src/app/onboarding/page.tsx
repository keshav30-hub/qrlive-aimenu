
'use client';

import { useState, useRef } from 'react';
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
import { Building, User, Phone, MapPin, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const libraries: ('places')[] = ['places'];

export default function OnboardingPage() {
  const router = useRouter();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || '',
    libraries,
  });

  const handleCompleteOnboarding = () => {
    // Here you would typically save the data
    // and then redirect the user.
    router.push('/dashboard');
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      setAddress(place.formatted_address || '');
      console.log(place);
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
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
              <Input id="business-name" placeholder="e.g., The Gourmet Place" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-name">Owner Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="owner-name" placeholder="e.g., John Doe" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile-number">Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="mobile-number" type="tel" placeholder="e.g., 9876543210" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-address">Full Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              {isLoaded ? (
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <Input 
                    id="full-address" 
                    placeholder="Start typing your address..." 
                    className="pl-10"
                    value={address}
                    onChange={handleAddressChange}
                  />
                </Autocomplete>
              ) : (
                <Input 
                  id="full-address" 
                  placeholder="Loading address search..." 
                  className="pl-10"
                  disabled 
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gst-detail">GST Detail (Optional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="gst-detail" placeholder="Enter your GST number" className="pl-10" />
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
