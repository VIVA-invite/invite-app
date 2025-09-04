import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PillButton from "src/app/utils/pillButton";

type EventStatus = "draft" | "upcoming" | "past";
interface Rsvp { going: number; maybe: number; declined: number; unknown: number; }
interface UserEventCardDto {
  id: string;
  name: string;
  startsAt?: string;         // undefined when draft
  locationText?: string;
  rsvp: Rsvp;
  status: EventStatus;
  updatedAt: string;         // ISO
}

// Mock data for now (swap to API later)
const mock: UserEventCardDto[] = [
  { id: "evt_demo", name: "Christine's Birthday Picnic", startsAt: "2025-09-20T11:00:00-07:00", locationText: "Gas Works Park", rsvp: { going: 24, maybe: 5, declined: 3, unknown: 18 }, status: "upcoming", updatedAt: "2025-08-15T10:00:00Z" },
  { id: "evt_draft1", name: "NYE Party", rsvp: { going: 0, maybe: 0, declined: 0, unknown: 0 }, status: "draft", updatedAt: "2025-08-10T09:00:00Z" },
  { id: "evt_past1", name: "Brunch Crew", startsAt: "2024-04-14T10:30:00-07:00", locationText: "Capitol Hill", rsvp: { going: 8, maybe: 2, declined: 1, unknown: 0 }, status: "past", updatedAt: "2024-04-15T12:00:00Z" }
];

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function UserDashboard(): React.ReactElement {
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return mock
      .filter(e => (filter === "all" ? true : e.status === filter))
      .filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  }, [filter, q]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your events</h1>
        <PillButton to="/">New Event</PillButton>
      </div>

      <div className="flex gap-2">
        {(["all","upcoming","draft","past"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm border ${filter===f ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-100"}`}
            aria-pressed={filter===f}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name…"
          className="ml-auto w-64 px-3 py-2 rounded-md border text-sm"
          aria-label="Search events"
        />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map(e => {
          const dateStr = e.startsAt ? new Date(e.startsAt).toLocaleString() : "Draft";
          return (
            <li key={e.id} className="rounded-2xl border bg-white shadow p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{e.name}</h2>
                  <p className="text-xs text-gray-500">
                    {dateStr}{e.locationText ? ` • ${e.locationText}` : ""}
                  </p>
                </div>
                <span className="text-xs rounded-full px-2 py-1 border bg-gray-50">
                  {e.status}
                </span>
              </div>

              <div className="flex gap-6">
                <Stat label="Going" value={e.rsvp.going} />
                <Stat label="Maybe" value={e.rsvp.maybe} />
                <Stat label="Declined" value={e.rsvp.declined} />
                <Stat label="No resp." value={e.rsvp.unknown} />
              </div>

              <div className="flex gap-2">
                <Link to={`/event?eventId=${e.id}`} className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm">
                  Open event
                </Link>
                {e.status === "draft" ? (
                  <Link to={`/dateTime?eventId=${e.id}`} className="px-3 py-1 rounded-full border text-sm">
                    Resume draft
                  </Link>
                ) : (
                  <Link to={`/invitee?eventId=${e.id}`} className="px-3 py-1 rounded-full border text-sm">
                    Invitees
                  </Link>
                )}
              </div>

              <p className="text-[11px] text-gray-400 mt-1">
                Updated {new Date(e.updatedAt).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
