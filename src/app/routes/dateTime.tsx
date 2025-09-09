/**
 * Page where user enters the date and time for the invitation
 */
import { JapaneseYen } from "lucide-react";
import { useEffect, useState } from "react";
import PillButton from "src/app/utils/pillButton";

const STORAGE_KEY = "viva:dateTime";

export default function DateTime() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          date?: string;
          startTime?: string;
          endTime?: string;
        };
        if (typeof saved.date === "string") setDate(saved.date);
        if (typeof saved.startTime === "string") setStartTime(saved.startTime);
        if (typeof saved.endTime === "string") setEndTime(saved.endTime);
      }
    } catch {}
    finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date, startTime, endTime })
    );
  }, [hydrated, date, startTime, endTime]);

  // const isComplete = date && startTime && endTime;

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">📅 Date & Time</h1>

      {/* Date Input */}
      <div>
        <label className="block mb-1 font-medium">When is your event?</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      {/* Time Inputs — only show if date is selected */}
      {date && (
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 flex gap-2">
        <PillButton to="/">Home</PillButton>
        <PillButton to="/activity">Next</PillButton>
      </div>
    </main>
  );
}