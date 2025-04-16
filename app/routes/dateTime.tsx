import { useState } from "react";
import PillButton from "~/utils/pillButton";

export default function DateTime() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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

      <PillButton to="/activity">Next</PillButton>
      <PillButton to="/">Home</PillButton>
    </main>
  );
}