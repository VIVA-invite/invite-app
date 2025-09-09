/**
 * Activity page with draggable timeline bar
 */
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PillButton from "../utils/pillButton";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import React from "react";

type Activity = {
    id: number;
    name: string;
    time: number; // in minutes
};

const STORAGE_KEY = "viva:activityState";

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
    // const totalDuration = endMinutes - startMinutes;
  
    const [activities, setActivities] = useState<Activity[]>([]);
    const [name, setName] = useState("");
    const [time, setTime] = useState("");

    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const saved = JSON.parse(raw) as {
                startTime?: string;
                endTime?: string;
                activities?: Activity[];
                name?: string;
                time?: string;
            };

            const sM = parseTime(saved.startTime ?? startTime);
            const eM = parseTime(saved.endTime ?? endTime);

            const clamp = (v: number) => Math.min(Math.max(v, startMinutes), endMinutes);

            const restoreActs = (saved.activities || []).map(a => ({ ...a, time: clamp(a.time)}))
                                                        .sort((a, b) => (a.time === b.time ? -1 : a.time - b.time));
            setActivities(restoreActs);
            if (typeof saved.name === "string") setName(saved.name);
            if (typeof saved.time === "string") setTime(saved.time);
        } catch {}
        finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const payload = JSON.stringify({
            startTime,
            endTime,
            activities,
            name,
            time,
        });
        localStorage.setItem(STORAGE_KEY, payload);
    }, [startTime, endTime, activities, name, time]);

    const totalDuration = endMinutes - startMinutes;
  
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background px-4 gap-6 pad-6">      
            <h1 className="text-3xl items-center font-bold">Plan Your Activities</h1>
            {/* Activity Input */}
            <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!name || !time) return;

                const newId = Date.now();
                const [hours, minutes] = time.split(":").map(Number);
                const totalMins = hours * 60 + minutes;
                if (totalMins < startMinutes || totalMins > endMinutes) {
                alert("Time is out of range!");
                return;
                }

                setActivities((prev) => {
                    const updated = [...prev, { id: newId, name, time: totalMins }];
                    return updated.sort((a, b) => {
                      if (a.time === b.time) return -1; // flip their order if equal
                      return a.time - b.time;
                    });
                  });

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
            <div className="relative w-full max-w-4xl h-28 flex flex-col gap-6">
            {/* Thin timeline bar */}
            {/* <div className="w-full h-3 bg-blue-200 rounded-full" /> */}
    
            {/* Single Slider for all activities */}
            {activities.length > 0 && (
                <Slider
                    range
                    allowCross={true}
                    step={5}
                    onChange={(values) => {
                        if (Array.isArray(values)) {
                            const updated = activities.map((a, i) => ({ ...a, time: values[i] }));
                            setActivities(updated.sort((a, b) => {
                                if (a.time === b.time) return -1; // flip their order if equal
                                return a.time - b.time;
                            }));
                        }
                    }}
                    min={startMinutes}
                    max={endMinutes}
                    value={activities.map(a => a.time)}
                    
                    trackStyle={[{ backgroundColor: '#bfdbfe' }]}
                    railStyle={{ backgroundColor: '#bfdbfe' }}
                    handleRender={(node, props) => {
                        const activity = activities[props.index];
                        const [hovered, setHovered] = React.useState(false);
                        return React.cloneElement(node, {
                            style: {
                                ...node.props.style,
                                position: 'absolute',
                                top: '-25%',
                                transform: 'translateY(0%)',
                                height: '32px',
                                backgroundColor: '#ffffff',
                                border: `2px solid ${hovered ? '#0EA5E9' : '#D1D5DB'}`,
                                borderRadius: '9999px',
                                padding: '0 0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap',
                                userSelect: 'none',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#1f2937',
                                width: 'fit-content',
                                transition: 'border-color 0.2s ease',
                            },
                            onMouseEnter: () => setHovered(true),
                            onMouseLeave: () => setHovered(false),
                            children: (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style = {{fontSize: '14px', alignItems: 'center', transform: 'translateY(40%)'}}>{activity.name}</div>
                                  <div style={{ fontSize: '12px', color: '#6B7280', transform: 'translateY(75%)'}}>{formatTime(activity.time)}</div>
                                </div>
                                
                              ),
                        });
                    }}
                />
            )}
            </div>

            <PillButton to="/invitee">Next</PillButton>
            <PillButton to="/"> Back to Home</PillButton>
        </main>
    );
} 