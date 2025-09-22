/**
 * For individual event in the dashboard. App level provider
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Rsvp = "going" | "maybe" | "declined" | "+1";

interface EventDto { id: string; name: string; startsAt: string; locationText: string; }
interface GuestDto { id: string; eventId: string; name: string; status: Rsvp; }
interface ActivityDto { id: string; eventId: string; title: string; startsAt: string; sortIndex: number; }

interface Summary { going: number; maybe: number; declined: number; unknown: number; }

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

interface EventState {
  loading: boolean;
  error?: string;
  event: EventDto | null;
  guests: GuestDto[];
  activities: ActivityDto[];
  summary: Summary;
  reload: (eventId: string) => void;
}

const Ctx = createContext<EventState | null>(null);

export function useEventState(): EventState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEventState must be used within <EventProvider>");
  return ctx;
}

export function EventProvider({ eventId, children }: { eventId: string; children: React.ReactNode }): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [acts, setActs] = useState<ActivityDto[]>([]);

  const summary = useMemo<Summary>(() => {
    return guests.reduce<Summary>(
      (acc, g) => ({ ...acc, [g.status]: (acc as any)[g.status] + 1 }),
      { going: 0, maybe: 0, declined: 0, unknown: 0 }
    );
  }, [guests]);

  const load = (id: string): void => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(undefined);
    Promise.all([
      // Use mock files for now. Swap to real endpoints later.
      getJSON<EventDto>(`/api/events/${id}.json`, ctrl.signal),
      getJSON<GuestDto[]>(`/api/events/${id}/guests.json`, ctrl.signal),
      getJSON<ActivityDto[]>(`/api/events/${id}/activities.json`, ctrl.signal)
    ])
      .then(([e, g, a]) => {
        setEvent(e);
        setGuests(g);
        setActs(a.slice().sort((x, y) => (x.startsAt < y.startsAt ? -1 : 1)));
      })
      .catch((err: unknown) => setError((err as { message?: string }).message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(eventId); }, [eventId]);

  return (
    <Ctx.Provider value={{ loading, error, event, guests, activities: acts, summary, reload: load }}>
      {children}
    </Ctx.Provider>
  );
}