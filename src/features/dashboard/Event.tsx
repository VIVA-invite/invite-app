/**
 * Dashboard for individual events (when you click on it on dashboard)
 */
import React from "react";
import { Calendar, MapPin, Users, ListChecks, Plus, Settings } from "lucide-react";
import PillButton from "src/app/utils/pillButton";

// Minimal UI wrappers (replace with shadcn/ui if installed)
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// A Card is just a styled container with optional header/content slots.
function Card({ children, className = "", ...props }: CardProps): React.ReactElement {
  return <div className={`border rounded-xl bg-white shadow ${className}`} {...props}>{children}</div>;
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <h2 className={`font-semibold ${className}`}>{children}</h2>;
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

// Mock data (replace with real data from your store/API later)
const mockEvent = {
  id: "evt_123",
  name: "Christine's Birthday Picnic",
  date: "2025-09-20T11:00:00-07:00",
  location: "Gas Works Park, Seattle",
  rsvp: { going: 24, maybe: 5, declined: 3, noResponse: 18 },
  actions: [
    { id: "a1", label: "Invite more guests", href: "/invitees" },
    { id: "a2", label: "Edit timeline", href: "/activities" },
    { id: "a3", label: "Update date/time", href: "/date" },
  ],
  upcoming: [
    { id: "u1", time: "11:30", title: "Setup & decorations" },
    { id: "u2", time: "12:00", title: "Guests arrive" },
    { id: "u3", time: "12:30", title: "Cake & photos" },
  ],
};

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

export default function EventDashboard(): React.ReactElement {
  const { name, date, location, rsvp, actions, upcoming } = mockEvent;
  const dateObj = new Date(date);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-gray-500 flex items-center gap-4 mt-2">
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4"/>{dateObj.toLocaleString()}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>{location}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <PillButton className="flex items-center gap-2"><Settings className="h-4 w-4"/>Settings</PillButton>
          <PillButton className="flex items-center gap-2" to="/"><Plus className="h-4 w-4"/>New Event</PillButton>
        </div>
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4"/>RSVP Summary</CardTitle></CardHeader>
          <CardContent className="flex justify-between gap-4">
            <Stat label="Going" value={rsvp.going} />
            <Stat label="Maybe" value={rsvp.maybe} />
            <Stat label="Declined" value={rsvp.declined} />
            <Stat label="No response" value={rsvp.noResponse} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4"/>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {actions.map(a => (
              <a key={a.id} href={a.href} className="text-sm text-blue-600 hover:underline">{a.label}</a>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4"/>Location</CardTitle></CardHeader>
          <CardContent>
            {/* Replace with your real map component later */}
            <div className="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center text-sm">Map preview</div>
            <div className="text-xs text-gray-500 mt-2">Edit on the Location page to update map & saved pins.</div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
          <CardContent>
            {/* Replace with your draggable timeline component */}
            <div className="w-full h-56 rounded-xl bg-gray-100 flex items-center justify-center text-sm">Timeline preview (drag/drop)</div>
            <div className="text-xs text-gray-500 mt-2">Drag activities to adjust times. Open Activities page for full editor.</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base">Upcoming Activities</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{u.time}</span>
                <span className="font-medium">{u.title}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
