import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PillButton from "src/app/utils/pillButton";
import { useInvitation } from "../utils/invitationContext";

const SUGGESTIONS = [
  "XXX's Birthday Picnic",
  "Friday Night Karaoke",
  "Team Offsite 2025",
  "Friendsgiving Potluck",
  "Game Night Extravaganza"
];

const STORAGE_KEY = "viva:eventName";

export default function EventName() {
  const navigate = useNavigate();
  const { eventName, setEventName } = useInvitation();
  const [showExamples, setShowExamples] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEventName(stored);
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, [setEventName]);

  useEffect(() => {
    if (!hydrated) return;
    if (eventName.trim()) {
      localStorage.setItem(STORAGE_KEY, eventName);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [hydrated, eventName]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;
    navigate("/partyType");
  };

  const handleSuggestion = (suggestion: string) => {
    setEventName(suggestion);
    setShowExamples(false);
  };

  const handleReset = () => {
    setEventName("");
    setShowExamples(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Name Your Event</h1>
        <p className="text-sm text-gray-600 max-w-xl">
          Choose a short, memorable title that will greet guests on the invitation and dashboard. Keep it friendly and descriptive.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="event-name" className="block text-sm font-medium text-gray-700">
            Event title
          </label>
          <input
            id="event-name"
            className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg px-4 py-3 text-lg"
            placeholder="e.g. Movie Night with Friends"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
            autoFocus
          />
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>{eventName.trim().length}/100 characters</span>
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => setShowExamples((prev) => !prev)}
            >
              {showExamples ? "Hide" : "Need ideas?"}
            </button>
          </div>
        </div>

        {showExamples && (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
            <p className="text-xs uppercase tracking-wide text-gray-500">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-gray-300 px-3 py-1 text-sm hover:border-blue-500 hover:text-blue-600"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <PillButton to="/" className="px-4 py-2">
            Home
          </PillButton>

          <PillButton type="button" onClick={handleReset} className="px-4 py-2">
            Reset
          </PillButton>

          <PillButton
            type="submit"
            disabled={!eventName.trim()}
            className="px-4 py-2"
            to="/partyType"
          >
            Next
          </PillButton>
        </div>
      </form>
    </div>
  );
}
