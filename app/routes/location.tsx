import { useEffect, useState, lazy, Suspense } from "react";
import { searchPlaces } from "../utils/nominatimSearch";

interface PlaceResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface SelectedPosition {
  lat: number;
  lng: number;
  display_name: string;
}

// Lazy load to avoid SSR issues
const LeafletMap = lazy(() => import("../utils/locationSearch"));

export default function LocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<SelectedPosition | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const delay = setTimeout(() => {
      searchPlaces(query).then(setResults);
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="p-4 flex flex-col gap-2">
      <input
        type="text"
        placeholder="Search for a location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 border rounded"
      />
      {results.length > 0 && (
        <ul className="bg-white border rounded max-h-40 overflow-y-auto shadow-md">
          {results.map((place, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-200 cursor-pointer text-sm"
              onClick={() => {
                setSelectedPosition({
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                  display_name: place.display_name,
                });
                setResults([]);
                setQuery(place.display_name);
              }}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}

      <Suspense fallback={<div>Loading map...</div>}>
        <LeafletMap
          position={
            selectedPosition
              ? [selectedPosition.lat, selectedPosition.lng]
              : [47.6062, -122.3321] // Default Seattle
          }
          label={selectedPosition?.display_name}
        />
      </Suspense>
    </div>
  );
}
