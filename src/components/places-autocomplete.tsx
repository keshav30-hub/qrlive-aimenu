'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const MAP_ID = 'google-map-script-places';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  value: string;
  onChange: (value: string) => void;
}

export function PlacesAutocomplete({ onPlaceSelect, value, onChange }: PlacesAutocompleteProps) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key is missing. Please add NEXT_PUBLIC_PLACES_API_KEY to your .env file.");
      return;
    }

    const loadScript = () => {
      const script = document.createElement('script');
      script.id = MAP_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsApiLoaded(true);
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps script.");
      };

      document.head.appendChild(script);
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      setIsApiLoaded(true);
    } else if (!document.getElementById(MAP_ID)) {
      loadScript();
    }
  }, []);

  useEffect(() => {
    if (isApiLoaded && inputRef.current && !autocompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        componentRestrictions: { country: "in" },
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        onPlaceSelect(place);
      });
    }
  }, [isApiLoaded, onPlaceSelect]);

  if (!isApiLoaded) {
    return (
        <Input 
            placeholder="Loading address search..." 
            className="pl-10"
            disabled 
        />
    );
  }

  return (
    <Input 
        ref={inputRef}
        type="text"
        id="full-address" 
        placeholder="Start typing your address..." 
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
    />
  );
}
