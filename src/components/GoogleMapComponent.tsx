/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';

interface Country {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
}

interface GoogleMapComponentProps {
  visitedCountries: Country[];
  onCountrySelect: (country: Country) => void;
}

interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: object) => any;
    MapTypeId: { ROADMAP: string };
    Marker: new (options: object) => any;
    InfoWindow: new (options: object) => any;
    SymbolPath: { CIRCLE: number };
  };
}

declare global {
  interface Window {
    google: GoogleMapsAPI;
  }
}

export default function GoogleMapComponent({ visitedCountries, onCountrySelect }: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGoogleMaps = async () => {
      try {
        // Wait for DOM to be ready
        if (typeof window === 'undefined') return;

        // Check if already loaded
        if (window.google && window.google.maps) {
          if (mounted) initializeMap();
          return;
        }

        // Load Google Maps API
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          if (mounted) {
            setError('Google Maps API key not configured');
            setIsLoading(false);
          }
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('Google Maps loaded successfully');
          if (mounted) {
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
              if (mounted) initializeMap();
            }, 100);
          }
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps');
          if (mounted) {
            setError('Failed to load Google Maps API');
            setIsLoading(false);
          }
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        if (mounted) {
          setError('Failed to initialize map');
          setIsLoading(false);
        }
      }
    };

    const initializeMap = () => {
      try {
        if (!mounted) return;
        
        if (!mapRef.current) {
          console.error('Map ref not available');
          setError('Map container not found');
          setIsLoading(false);
          return;
        }

        if (!window.google || !window.google.maps) {
          console.error('Google Maps API not loaded');
          setError('Google Maps failed to load');
          setIsLoading(false);
          return;
        }

        console.log('Initializing Google Maps...');

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 30, lng: 0 },
          zoom: 2,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#10b981' }, { weight: 2 }]
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.fill',
              stylers: [{ color: '#10b981' }, { opacity: 0.3 }]
            }
          ]
        });

        console.log('Map created successfully');

        // Add markers for visited countries
        visitedCountries.forEach((country) => {
          try {
            const marker = new window.google.maps.Marker({
              position: { lat: country.coordinates[0], lng: country.coordinates[1] },
              map: map,
              title: country.name,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            });

            // Add click listener for trip planning
            marker.addListener('click', () => {
              onCountrySelect(country);
            });

            // Add hover tooltip
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; text-align: center; min-width: 150px;">
                  <h3 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">${country.name}</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Visited together ✈️</p>
                </div>
              `
            });

            marker.addListener('mouseover', () => {
              infoWindow.open(map, marker);
            });

            marker.addListener('mouseout', () => {
              infoWindow.close();
            });
          } catch (markerError) {
            console.error('Error creating marker for', country.name, markerError);
          }
        });

        if (mounted) {
          setIsLoading(false);
          console.log('Google Maps initialization complete');
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        if (mounted) {
          setError('Failed to create map');
          setIsLoading(false);
        }
      }
    };

    // Wait for component to mount and DOM to be ready
    const timer = setTimeout(() => {
      loadGoogleMaps();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [visitedCountries, onCountrySelect]);

  if (error) {
    return (
      <div className="w-full h-full rounded-lg flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Map Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg relative"
      style={{ 
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        minHeight: '600px'
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
