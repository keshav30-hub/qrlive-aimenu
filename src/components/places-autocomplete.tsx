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
  onChange: (value: string) => void;
  value?: string;
}

export function PlacesAutocomplete({ onPlaceSelect, onChange, value }: PlacesAutocompleteProps) {
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
    
    const input = autocompleteElement.querySelector('input');
    if(input && value) {
      input.value = value;
    }

    const handlePlaceChange = (event: Event) => {
        const placeChangeEvent = event as PlaceChangeEvent;
        const place = placeChangeEvent.detail.place;
        onPlaceSelect(place);
    };

    const handleInputChange = (event: Event) => {
      const inputEvent = event as InputEvent;
      const target = inputEvent.target as HTMLInputElement;
      onChange(target.value);
    };
    
    autocompleteElement.addEventListener('gmp-placechange', handlePlaceChange);
    if (input) {
      input.addEventListener('input', handleInputChange);
    }
    isInitialized.current = true;

    return () => {
        autocompleteElement.removeEventListener('gmp-placechange', handlePlaceChange);
         if (input) {
          input.removeEventListener('input', handleInputChange);
        }
    };
  }, [isApiLoaded, onPlaceSelect, onChange, value]);

  if (!isApiLoaded) {
    return (
      <div 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      >
        Loading address search...
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          gmp-place-autocomplete::part(input) {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            display: flex;
            height: 2.5rem; /* h-10 */
            width: 100%;
            border-radius: 0.375rem; /* rounded-md */
            border: 1px solid hsl(var(--input));
            padding: 0.5rem 0.75rem;
            padding-left: 2.5rem; /* for the icon */
            font-size: 1rem; /* text-base */
            line-height: 1.5rem;
          }
          gmp-place-autocomplete::part(input):focus {
            outline: none;
            border-color: hsl(var(--ring));
            box-shadow: 0 0 0 2px hsl(var(--ring));
          }
        `}
      </style>
      <gmp-place-autocomplete
        ref={autocompleteRef}
        placeholder="Start typing your address..."
        country-codes="in"
        part="input"
      ></gmp-place-autocomplete>
    </>
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
