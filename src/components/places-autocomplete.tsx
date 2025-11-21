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
  defaultValue?: string;
}

export function PlacesAutocomplete({ onPlaceSelect, defaultValue }: PlacesAutocompleteProps) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLElement | null>(null);
  const isInitialized = useRef(false);

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
    if (!isApiLoaded || !autocompleteElement || isInitialized.current) return;
    
    // Set initial value if provided
    if (defaultValue) {
        (autocompleteElement as any).value = defaultValue;
    }

    const handlePlaceChange = (event: Event) => {
        const placeChangeEvent = event as PlaceChangeEvent;
        const place = placeChangeEvent.detail.place;
        onPlaceSelect(place);
    };
    
    autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
    isInitialized.current = true;

    return () => {
        autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
    };
  }, [isApiLoaded, onPlaceSelect, defaultValue]);

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
        part="input"
      ></gmp-place-autocomplete>
  );
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
          'country-codes'?: string;
          placeholder?: string;
          part?: string;
          value?: string;
        }, HTMLElement>;
    }
  }
}
