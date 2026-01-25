/**
 * Dashboard for individual events (when you click on it on dashboard)
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Users, ListChecks, Plus, Settings } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, type DocumentData } from "firebase/firestore";
import PillButton from "src/app/utils/pillButton";
import { auth, db } from "src/app/lib/firebase";

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

interface InviteDoc extends DocumentData {
  hostUid?: string;
  hostUsername?: string | null;
  eventType?: string[];
  theme?: string | string[];
  location?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventName?: string;
  invitees?: string[];
  activities?: Array<{ id?: string; name?: string; time?: number }>;
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export default function EventDashboard(): React.ReactElement {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [host, setHost] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDoc | null>(null);
  const [rsvp, setRsvp] = useState({ going: 0, maybe: 0, declined: 0, noResponse: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setHost(user);
      setAuthReady(true);
      if (!user) {
        navigate(`/hostLogIn?redirect=${encodeURIComponent(`/host/events/${inviteId}/overview`)}`, { replace: true });
      }
    });
    return () => unsub();
  }, [inviteId, navigate]);

  useEffect(() => {
    if (!inviteId) {
      setError("Missing invite id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDoc(doc(db, "invites", inviteId))
      .then((snap) => {
        if (!snap.exists()) {
          throw new Error("Invite not found.");
        }
        if (!cancelled) setInvite(snap.data() as InviteDoc);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError((err as { message?: string }).message ?? "Failed to load invite.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  useEffect(() => {
    if (!inviteId) return;
    const guestsRef = collection(db, "invites", inviteId, "guests");
    const unsub = onSnapshot(guestsRef, (snapshot) => {
      let going = 0;
      let maybe = 0;
      let declined = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.attending === "yes") going++;
        else if (data.attending === "maybe") maybe++;
        else if (data.attending === "no") declined++;
      });
      setRsvp({ going, maybe, declined, noResponse: 0 });
    });
    return () => unsub();
  }, [inviteId]);

  const eventName = useMemo(() => {
    if (!invite) return "Your Event";
    if (typeof invite.eventName === "string" && invite.eventName.trim()) return invite.eventName.trim();
    if (Array.isArray(invite.theme) && invite.theme.length) return invite.theme.join(" • ");
    if (typeof invite.theme === "string" && invite.theme.trim()) return invite.theme.trim();
    if (Array.isArray(invite.eventType) && invite.eventType.length) return invite.eventType.join(", ");
    return "Your Event";
  }, [invite]);

  const dateLabel = invite?.date?.trim() || "Date to be decided";
  const timeLabel = invite?.startTime && invite?.endTime
    ? `${invite.startTime} – ${invite.endTime}`
    : invite?.startTime || invite?.endTime || "Time to be decided";
  const locationLabel = invite?.location?.trim() || "Location to be decided";

  const actions = useMemo(() => ([
    { id: "a1", label: "Edit event name", to: "/eventName" },
    { id: "a2", label: "Edit timeline", to: "/activity" },
    { id: "a3", label: "Update date/time", to: "/dateTime" },
  ]), []);

  const upcoming = useMemo(() => {
    if (!invite?.activities?.length) return [];
    return invite.activities
      .slice()
      .sort((a, b) => {
        const ta = typeof a.time === "number" ? a.time : 0;
        const tb = typeof b.time === "number" ? b.time : 0;
        return ta - tb;
      })
      .slice(0, 3)
      .map((act, idx) => ({
        id: act.id ?? `act-${idx}`,
        time: typeof act.time === "number" ? formatMinutes(act.time) : "TBD",
        title: act.name || "Untitled activity",
      }));
  }, [invite?.activities]);

  const rsvpSummary = useMemo(() => {
    const totalInvitees = Array.isArray(invite?.invitees) ? invite!.invitees!.length : 0;
    const known = rsvp.going + rsvp.maybe + rsvp.declined;
    return {
      going: rsvp.going,
      maybe: rsvp.maybe,
      declined: rsvp.declined,
      noResponse: Math.max(totalInvitees - known, 0),
    };
  }, [invite, rsvp]);

  const inviteBelongsToHost = useMemo(() => {
    if (!host || !invite) return true;
    if (!invite.hostUid) return true;
    return invite.hostUid === host.uid;
  }, [host, invite]);

  if (!authReady || loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <p className="text-sm text-gray-600">Loading invitation details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <p className="text-sm text-red-600">{error}</p>
        <PillButton to="/host">Back to dashboard</PillButton>
      </div>
    );
  }

  if (!inviteBelongsToHost) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <p className="text-sm text-red-600">
          This invite belongs to a different host account. Sign in with the correct username to continue.
        </p>
        <PillButton to="/host">Back to dashboard</PillButton>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{eventName}</h1>
          <p className="text-gray-500 flex items-center gap-4 mt-2">
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4"/>{dateLabel} • {timeLabel}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4"/>{locationLabel}</span>
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
            <Stat label="Going" value={rsvpSummary.going} />
            <Stat label="Maybe" value={rsvpSummary.maybe} />
            <Stat label="Declined" value={rsvpSummary.declined} />
            <Stat label="No response" value={rsvpSummary.noResponse} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4"/>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {actions.map(a => (
              <Link
                key={a.id}
                to={a.to}
                state={{ mode: "edit", inviteId }}
                className="text-sm text-blue-600 hover:underline"
              >
                {a.label}
              </Link>
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
            {upcoming.length === 0 && (
              <p className="text-sm text-gray-500">No activities yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
