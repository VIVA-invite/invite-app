/**
 * Pick location for the location page
 */
import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import {useInvitation} from "./invitationContext";
import PillButton from "./pillButton";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 47.6062,
  lng: -122.3321,
};


const LocationPicker = () => {
  const { setLocation: updateInvitationLocation } = useInvitation();
  const [center, setCenter] = useState(defaultCenter);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCenter = { lat, lng };
        setCenter(newCenter);
        setMarker(newCenter);
      }

      const address = place.formatted_address || place.name || "";
      updateInvitationLocation(address);
      setConfirmationMessage("📍 Address saved!");
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(inputValue)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.results?.[0]) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;
      const newCenter = { lat, lng };
      setCenter(newCenter);
      setMarker(newCenter);
      updateInvitationLocation(result.formatted_address || "");
      setConfirmationMessage("📍 Address saved!");
    }
  };

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => setConfirmationMessage(""), 2500);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  return (
    <div className="flex flex-col gap-4">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              placeholder="Enter a location"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "100%",
              }}
            />
          </Autocomplete>
          <PillButton type="submit">Enter</PillButton>
        </form>

        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {marker && <Marker position={marker} />}
        </GoogleMap>
        {confirmationMessage && (
          <div className="text-green-600 text-sm mt-2 animate-fadeIn">{confirmationMessage}</div>
        )}
        {inputValue && (
          <div className="text-sm text-gray-700 mt-1">
            Selected: <span className="font-medium">{inputValue}</span>
          </div>
        )}
      </LoadScript>
    </div>
  );
};

export default LocationPicker;