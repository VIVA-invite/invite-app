/**
 * Page for user to enter location
 */
import { useEffect } from "react";
import PillButton from "src/app/utils/pillButton";
import LocationPicker from "../utils/locationSearch";

const STORAGE_KEY = "viva:location";

export default function Location() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Choose a Location</h1>
      <LocationPicker />

      <div className="fixed bottom-6 right-6 flex gap-2">
        <PillButton to="/">Home</PillButton>
        <PillButton type="button" onClick={handleReset}>
          Reset
        </PillButton>
        <PillButton to="/confirmation">Next</PillButton>
      </div>
    </div>
  );
}
