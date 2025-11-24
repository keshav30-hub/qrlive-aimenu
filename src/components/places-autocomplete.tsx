"use client";

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  value?: string;
  onValueChange: (value: string) => void;
}

export function PlacesAutocomplete({
  onPlaceSelect,
  value,
  onValueChange,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;
    if (!apiKey) {
      console.error('Google Places API key is missing.');
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
        if (window.google?.maps?.places) {
            initializeAutocomplete();
        }
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&async=1&defer=1`;
    script.onload = () => {
        initializeAutocomplete();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script.');
    };
    document.head.appendChild(script);

    function initializeAutocomplete() {
        if (!inputRef.current || !window.google?.maps?.places) return;

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
                types: ['address'],
                componentRestrictions: { country: 'in' },
            }
        );

        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            onPlaceSelect(place || null);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Start typing your address..."
        className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
      />
    </div>
  );
}
