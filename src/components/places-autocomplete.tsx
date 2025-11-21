
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

const MAP_ID = 'google-map-script-places';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
}

// Extend the JSX IntrinsicElements to include the custom web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmp-place-autocomplete': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export function PlacesAutocomplete({ onPlaceSelect }: PlacesAutocompleteProps) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;
    if (!apiKey) {
      console.error("Google Places API key is missing. Please add NEXT_PUBLIC_PLACES_API_KEY to your .env file.");
      return;
    }

    if (window.google && window.google.maps) {
        setIsApiLoaded(true);
        return;
    }

    const existingScript = document.getElementById(MAP_ID);
    if (existingScript) {
        // Assume if script exists, it will eventually load google.maps
        const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setIsApiLoaded(true);
                clearInterval(checkGoogle);
            }
        }, 100);
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

  }, []);

  useEffect(() => {
    if (isApiLoaded && autocompleteRef.current && inputRef.current) {
        const autocompleteElement = autocompleteRef.current;
        const inputElement = inputRef.current;

        // Set the input element for the autocomplete web component
        autocompleteElement.appendChild(inputElement);

        const handlePlaceChange = async (event: Event) => {
            const autocomplete = (event.target as any);
            const place = await autocomplete.getPlace();
            if (place) {
                onPlaceSelect(place);
            } else {
                onPlaceSelect(null);
            }
        };

        autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);

        return () => {
            autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
        };
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
    <gmp-place-autocomplete ref={autocompleteRef}>
        <Input 
            ref={inputRef}
            type="text"
            id="full-address" 
            placeholder="Start typing your address..." 
            className="pl-10"
        />
    </gmp-place-autocomplete>
  );
}
