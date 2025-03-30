import { useLocation } from "react-router-dom";
import { useState } from "react";
import PillButton from "~/utils/pillButton";

type Activity = {
    id: number;
    name: string;
    time: number; // in minutes
};

const formatTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const parseTime = (str: string) => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
};

export default function Activity() {
    const location = useLocation();
    const { startTime = "08:00", endTime = "18:00" } = location.state || {};
  
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    const totalDuration = endMinutes - startMinutes;
  
    const [activities, setActivities] = useState<Activity[]>([]);
    const [name, setName] = useState("");
    const [time, setTime] = useState("");

  
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 gap-6 pad-6">      
            <h1 className="text-3xl items-center font-bold">Plan Your Activities</h1>
            {/* Activity Input */}
            <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!name || !time) return;

                const newId = Date.now();
                const [hours, minutes] = time.split(":").map(Number);
                const totalMins = hours * 60 + minutes;
                const relativeTime = totalMins - startMinutes;

                if (relativeTime < 0 || relativeTime > totalDuration) {
                alert("Time is out of range!");
                return;
                }

                setActivities((prev) => [
                ...prev,
                { id: newId, name, time: relativeTime },
                ]);

                setName("");
                setTime("");
            }}
            className="flex flex-col md:flex-row gap-4 items-center mb-6"
            >
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Activity name"
                className="border border-gray-300 rounded-md px-4 py-2 w-60"
                required
            />
            <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2"
                required
            />
            <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
                Add Activity
            </button>
            </form>
            
            {/* Timeline Bar */}
            <div className="relative w-full max-w-4xl h-28">
            {/* Thin timeline bar */}
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-blue-200 rounded-full -translate-y-1/2" />
    
            {/* Activity Icons */}
            {activities.map((activity) => {
                const leftPercent = (activity.time / totalDuration) * 100;
    
                return (
                <div
                    key={activity.id}
                    className="absolute text-center"
                    style={{ left: `${leftPercent}%`, top: "0" }}
                    draggable
                    onDragEnd={(e) => {
                    const bar = e.currentTarget.parentElement;
                    if (!bar) return;
    
                    const barRect = bar.getBoundingClientRect();
                    const offsetX = e.clientX - barRect.left;
                    const newTime = Math.round(
                        (offsetX / barRect.width) * totalDuration
                    );
                    setActivities((prev) =>
                        prev.map((a) =>
                        a.id === activity.id ? { ...a, time: newTime } : a
                        )
                    );
                    }}
                >
                    <div className="w-16 h-16 rounded-full bg-pink-400 text-white text-sm flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition mx-auto">
                    {activity.name}
                    </div>
                    <div className="text-xs text-gray-700 mt-1 font-medium">
                    {formatTime(startMinutes + activity.time)}
                    </div>
                </div>
                );
            })}
            </div>

            <PillButton to="/invitee">Next</PillButton>
            <PillButton to="/"> Back to Home</PillButton>
        </main>
    );
}  