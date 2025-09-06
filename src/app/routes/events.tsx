import React from "react";
import { useSearchParams } from "react-router-dom";
import { EventDashboard } from "@/features/dashboard"; // <- correct component from barrel
import { EventProvider } from "@/app/utils/eventContext";

export default function EventRoute(): React.ReactElement {
  const [params] = useSearchParams();
  const eventId = params.get("eventId") ?? "evt_demo"; // keep your dev fallback for now

  return (
    <EventProvider eventId={eventId}>
      <EventDashboard key={eventId} />
    </EventProvider>
  );
}
