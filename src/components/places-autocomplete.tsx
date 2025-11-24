"use client";

import React, { useEffect, useRef, useState } from 'react';

// Define the custom event type for gmp-placechange
interface PlaceChangeEvent extends Event {
  detail: {
    place: google.maps.places.PlaceResult;
  };
}

const MAP_ID = 'google-map-script-places';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  onValueChange: (value: string) => void;
  value: string;
}

export function PlacesAutocomplete({ onPlaceSelect, onValueChange, value }: PlacesAutocompleteProps) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLElement & { value: string } | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key is missing. Please add NEXT_PUBLIC_PLACES_API_KEY to your .env file.");
      return;
    }

    const loadScript = () => {
      if (document.getElementById(MAP_ID)) {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsApiLoaded(true);
        }
        return;
      }
      
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
    } else {
      loadScript();
    }
  }, []);
  
  useEffect(() => {
    const autocompleteElement = autocompleteRef.current;
    if (!isApiLoaded || !autocompleteElement) return;

    const handlePlaceChange = (event: Event) => {
        const placeChangeEvent = event as PlaceChangeEvent;
        const place = placeChangeEvent.detail.place;
        onPlaceSelect(place);
        if (place?.formatted_address) {
          onValueChange(place.formatted_address);
        }
    };
    
    const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement;
        onValueChange(target.value);
    };
    
    autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
    autocompleteElement.addEventListener('input', handleInput);

    return () => {
        autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
        autocompleteElement.removeEventListener('input', handleInput);
    };
  }, [isApiLoaded, onPlaceSelect, onValueChange]);

  useEffect(() => {
    if (autocompleteRef.current && autocompleteRef.current.value !== value) {
      autocompleteRef.current.value = value;
    }
  }, [value]);


  if (!isApiLoaded) {
    return (
      <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm animate-pulse" />
    );
  }

  return (
      <gmp-place-autocomplete
        ref={autocompleteRef}
        placeholder="Start typing your address..."
        country-codes="in"
      ></gmp-place-autocomplete>
  );
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
          'country-codes'?: string;
          placeholder?: string;
          value?: string;
        }, HTMLElement>;
    }
  }
}
