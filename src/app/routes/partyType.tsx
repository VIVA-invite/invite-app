/**
 * User determining the type of the invitation (Graduation party, birthday etc.)
 */
import React, { useEffect, useState } from "react";
import { useInvitation } from "src/app/utils/invitationContext";
import PillButton from "src/app/utils/pillButton";

const predefinedTypes = [
  "Birthday Party",
  "Dinner Party",
  "Brunch Party",
  "Night Party",
  "Pool Party",
  "Graduation Party",
  "Baby Shower",
  "Housewarming",
];

const STORAGE_KEY = "viva:partyType";

export default function PartyType () {
  const { eventType, setEventType } = useInvitation();
  const [customType, setCustomType] = useState("");

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as string[];
        if (Array.isArray(saved)) {
          setEventType(saved);
        }
      }
    } catch {}
    finally {
      setHydrated(true);
    }
  }, [setEventType]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventType));
  }, [hydrated, eventType]);
  
  const handleSelect = (type: string) => {
    if (eventType.includes(type)) {
      setEventType(eventType.filter(t => t !== type));
    } else {
      setEventType([...eventType, type]);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customType.trim();
    if (trimmed && !eventType.includes(trimmed)) {
        setEventType([...eventType, trimmed]);
        setCustomType("");
    }
  };

  return (
    <main>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-center">What’s the Occasion?</h2>

        <div className="flex flex-wrap gap-2 mb-4">
            {predefinedTypes.map((type) => (
            <PillButton
                isSelected={eventType.includes(type)}
                onClick={() => handleSelect(type)}
            >{type}</PillButton>
            ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="flex gap-2 mb-6">
            <input
            type="text"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Add your own..."
            className="border border-gray-300 rounded-full px-4 py-2 w-full"
            />
            <button
            type="submit"
            className="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600"
            >
            Add
            </button>
        </form>

        {eventType && eventType.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Your Theme Vibe Preview</h3>
            <div className="flex flex-wrap gap-2">
              {eventType.map((type) => (
                <PillButton
                  key={type}
                  isSelected={true}
                  onClick={() => handleSelect(type)}
                >
                  {type}
                </PillButton>
              ))}
            </div>
          </div>
        )}
        
        </div>

        <div className="fixed bottom-6 right-6 flex gap-2">
            <PillButton to="/">Home</PillButton>
            <PillButton to="/theme">Next</PillButton>
          </div>
    </main>
  );
}
