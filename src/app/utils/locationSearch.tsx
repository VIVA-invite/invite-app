import { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 47.6062,
  lng: -122.3321,
};

const LocationPicker = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const autocompleteRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = autocompleteRef.current as any;
    if (!el) return;

    const handlePlaceChange = () => {
      const place = el?.value?.place;
      if (!place?.location) return;

      const { latitude, longitude } = place.location;
      const newCenter = { lat: latitude, lng: longitude };
      setCenter(newCenter);
      setMarker(newCenter);
    };

    el.addEventListener("gmpx-placeautocomplete-placechange", handlePlaceChange);
    return () => el.removeEventListener("gmpx-placeautocomplete-placechange", handlePlaceChange);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <gmpx-place-autocomplete
          ref={autocompleteRef}
          style={{
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        ></gmpx-place-autocomplete>

        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default LocationPicker;