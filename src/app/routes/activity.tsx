/**
 * Activity page with draggable timeline bar
 */
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import PillButton from "../utils/pillButton";
import {DndContext, PointerSensor, useSensor, useSensors, 
  DragStartEvent, DragEndEvent, DragMoveEvent, useDraggable} from "@dnd-kit/core";
import React from "react";
import { useInvitation } from "../utils/invitationContext"; // context holding event info

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

const parseTime = (str: string | null | undefined, fallbackMinutes = 9 * 60) => {
    if (!str) return fallbackMinutes;
    const parts = str.split(":");
    if (parts.length < 2) return fallbackMinutes;
    const [h, m] = parts.map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMinutes;
    return h * 60 + m;
};

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

export default function Activity() {
    const invitationData = useInvitation();
    const location = useLocation();
    const { startTime = invitationData.startTime, endTime = invitationData.endTime } = location.state || {};

    const resolvedStart = startTime ?? DEFAULT_START;
    const resolvedEnd = endTime ?? DEFAULT_END;

    let startMinutes = parseTime(resolvedStart, parseTime(DEFAULT_START));
    let endMinutes = parseTime(resolvedEnd, parseTime(DEFAULT_END));

    if (endMinutes <= startMinutes) {
        endMinutes = startMinutes + 60; // ensure at least one hour window
    }
  
    const {activities, setActivities} = useInvitation();
    const [name, setName] = useState("");
    const [time, setTime] = useState("");

    const [hydrated, setHydrated] = useState(false);

    // DnD & layout helpers
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
      })
    );
    const [activeId, setActiveId] = useState<number | null>(null);
    const [activeStartY, setActiveStartY] = useState<number>(0);
    const [previewY, setPreviewY] = useState<number | null>(null);
    const [previewTime, setPreviewTime] = useState<number | null>(null);

    // Local storage
    const STORAGE_KEY = "viva:activityState";
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

            const sM = parseTime(saved.startTime ?? resolvedStart, startMinutes);
            const eM = parseTime(saved.endTime ?? resolvedEnd, endMinutes);

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
            startTime: resolvedStart,
            endTime: resolvedEnd,
            activities,
            name,
            time,
        });
        localStorage.setItem(STORAGE_KEY, payload);
    }, [resolvedStart, resolvedEnd, activities, name, time, hydrated]);

    const totalDuration = endMinutes - startMinutes;
    const stepMinutes = 5; // snap to 5 minute increments

    const getContainerHeight = () => containerRef.current?.clientHeight ?? 1;
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const timeToY = (t: number) => {
      const h = getContainerHeight();
      const ratio = (t - startMinutes) / totalDuration;
      return clamp(ratio * h, 0, h);
    };

    const yToTime = (y: number) => {
      const h = getContainerHeight();
      const ratio = clamp(y, 0, h) / h;
      const minutes = startMinutes + ratio * totalDuration;
      const snapped = Math.round(minutes / stepMinutes) * stepMinutes;
      return clamp(snapped, startMinutes, endMinutes);
    };

    const handleDragStart = (event: DragStartEvent) => {
      const id = event.active.id as number;
      setActiveId(id);
      const act = activities.find(a => a.id === id);
      if (act) {
        setActiveStartY(timeToY(act.time));
        setPreviewTime(act.time);
        const y = timeToY(act.time);
        setPreviewY(y);
      }
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const id = event.active.id as number;
      const newY = activeStartY + (event.delta?.y ?? 0);
      const newTime = yToTime(newY);
      setActivities(prev =>
        prev
          .map(a => (a.id === id ? { ...a, time: newTime } : a))
          .sort((a, b) => (a.time === b.time ? -1 : a.time - b.time))
      );
      setActiveId(null);
      setPreviewTime(null);
    };
    const handleDragMove = (event: DragMoveEvent) => {
      if (activeId == null) return;
      const y = activeStartY + (event.delta?.y ?? 0);
      setPreviewTime(yToTime(y));
    };
  
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background px-4 gap-6 pad-6">      
            <div className="flex w-full gap-6">
            
            {/* Vertical Timeline with DnD Kit */}
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragMove={handleDragMove}
            >
              <div ref={containerRef} className="relative w-10 h-[520px] md:h-[600px] self-start -ml-4">
                {/* Thin blue bar */}
                <div className="absolute inset-y-0 left-20 w-2 bg-gray-400 rounded-full" />
                {/* Draggable pills overflow to the right of the bar */}
                {activities.map((a) => (
                  <DraggablePill
                    key={a.id}
                    id={a.id}
                    name={a.name}
                    time={a.time}
                    dragTime={activeId === a.id && previewTime !== null ? previewTime : null}
                    y={timeToY(a.time)}
                    onRemove={() => setActivities(prev => prev.filter(p => p.id !== a.id))}
                  />
                ))}
              </div>
            </DndContext>
            {/* Right side content vertically + horizontally centered */}
            <div className="flex-1 h-[520px] md:h-[600px] flex items-center justify-center">
              <div className="w-full max-w-xl mx-auto">
                <h1 className="text-3xl font-bold text-center w-full">Plan Your Activities</h1>
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
                        if (a.time === b.time) return -1;
                        return a.time - b.time;
                      });
                    });

                    setName("");
                    setTime("");
                  }}
                  className="flex flex-col md:flex-row gap-4 items-center mt-6"
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
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                    Add Activity
                  </button>
                </form>
              </div>
            </div>
            </div>

            <div className="fixed bottom-6 right-6 flex gap-2">
                    <PillButton to="/">Home</PillButton>
                    <PillButton to="/dateTime">Next</PillButton>
            </div>
        </main>
    );
}

type DraggablePillProps = {
  id: number;
  name: string;
  time: number;
  dragTime?: number | null;
  y: number;
  onRemove: () => void;
};

function DraggablePill({ id, name, time, dragTime = null, y, onRemove }: DraggablePillProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [hovered, setHovered] = React.useState(false);
  const style: React.CSSProperties = {
    position: "absolute",
    left: 100, // offset from the blue bar
    top: y - 16, // center the 32px pill on y
    transform: transform ? `translate3d(0px, ${transform.y}px, 0)` : undefined,
    cursor: "grab",
    userSelect: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between py-2 px-4 rounded-full bg-white ring-1 ring-gray-300 transition-shadow duration-300 hover:ring-2 hover:ring-gray-300 hover:shadow active:ring-4 active:ring-gray-300 active:shadow`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...listeners}
      {...attributes}
    >
      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{name}</span>
        {/* <span className="text-xs text-gray-500">{formatTime(time)}</span> */}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 font-bold text-large text-gray-800 hover:text-red-700 transition-colors duration-300"
        aria-label="Remove activity"
      >
          𐌗
      </button>
      <div className="absolute z-20 text-xs font-medium text-gray-800" style={{ left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }}>
        {formatTime(dragTime ?? time)}
      </div>
    </div>
  );
}


