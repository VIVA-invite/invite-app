import React from "react";
import { useSearchParams } from "react-router-dom";
// import { UserDashboard } from "@/features/dashboard";
import { EventProvider } from "@/app/utils/eventContext"; // <- event provider for dashboard version

export default function Event(): React.ReactElement {
  const [params] = useSearchParams();
  const eventId = params.get("eventId") ?? "evt_demo"; // dev fallback
  return (
    <EventProvider eventId={eventId}>
      <Event />
    </EventProvider>
  );
}
