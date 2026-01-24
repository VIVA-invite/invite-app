/**
 * Page where user enters the date and time for the invitation
 */
import { useEffect, useState } from "react";
import PillButton from "src/app/utils/pillButton";
import { useInvitation } from "src/app/utils/invitationContext";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";


const STORAGE_KEY = "viva:dateTime";

export default function DateTime() {
  const {
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
  } = useInvitation();

  const location = useLocation();
  const { mode = "", inviteId = "" } = location.state || {};
  const isEdit = mode === "edit";
  const navigate = useNavigate();

  // Local storage
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
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, [setDate, setStartTime, setEndTime]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date, startTime, endTime })
    );
  }, [hydrated, date, startTime, endTime]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;

    if (isEdit && inviteId) {
      await updateDoc(doc(db, "invites", inviteId), {
        date,
        startTime,
        endTime,
        updatedAt: new Date(),
      });

      localStorage.removeItem(STORAGE_KEY);
      navigate(`/host/events/${inviteId}`);
    } else {
      navigate("/activity", { state: { mode, inviteId } });
    }
  };

  const handleReset = () => {
    setDate("");
    setStartTime("");
    setEndTime("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">📅 Date & Time</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Input */}
      <div>
        <label className="block mb-1 font-medium">When is your event?</label>
        <input
          type="date"
          value={date ?? ""}
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
              value={startTime ?? ""}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">End Time</label>
            <input
              type="time"
              value={endTime ?? ""}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>
      )}

        <div className="flex gap-3 justify-end">
          {isEdit ? (
            <>
              <PillButton
                type="submit"
                className="px-4 py-2"
                disabled={!date || !startTime || !endTime}
              >
                Save
              </PillButton>
              <PillButton
                type="button"
                onClick={() => navigate(`/host/events/${inviteId}`)}
                className="px-4 py-2"
              >
                Cancel
              </PillButton>
            </>
          ) : (
            <>
              <PillButton
                to="/"
                className="px-4 py-2"
              >
                Home
              </PillButton>
              <PillButton
                type="button"
                onClick={handleReset} 
                className="px-4 py-2"
              >
                Reset
              </PillButton>
              <PillButton
                type="submit"
                className="px-4 py-2"
              >
                Next
              </PillButton>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
