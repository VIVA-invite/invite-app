/**
 * Host event dashboard – displays a saved invitation using the original layout.
 */
import { useEffect, useMemo, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Users, ListChecks, Plus, Settings } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc, type DocumentData } from "firebase/firestore";
import PillButton from "src/app/utils/pillButton";
import { auth, db } from "../lib/firebase";

interface InviteDoc extends DocumentData {
  hostUid?: string;
  hostUsername?: string | null;
  eventType?: string[];
  theme?: string | string[];
  location?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  invitees?: string[];
  activities?: Array<{ id?: string; name?: string; time?: string }>;
  customMessage?: string;
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function Card({ children, className = "", ...props }: CardProps): ReactElement {
  return (
    <div className={`border rounded-xl bg-white shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }): ReactElement {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }): ReactElement {
  return <h2 className={`font-semibold ${className}`}>{children}</h2>;
}

function CardContent({ children, className = "" }: { children: ReactNode; className?: string }): ReactElement {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: string | number }): ReactElement {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

const QUICK_ACTIONS = [
  { id: "invitees", label: "Invite more guests", href: "/invitee" },
  { id: "timeline", label: "Edit timeline", href: "/activity" },
  { id: "date", label: "Update date/time", href: "/dateTime" },
];

export default function HostEvent(): ReactElement {
  const { inviteId } = useParams();
  const navigate = useNavigate();

  const [host, setHost] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDoc | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setHost(user);
      setAuthReady(true);
      if (!user) {
        const redirectTarget = inviteId ? `/host/events/${inviteId}` : "/host/events";
        navigate(`/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
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

  const inviteBelongsToHost = useMemo(() => {
    if (!host || !invite) return true;
    if (!invite.hostUid) return true;
    return invite.hostUid === host.uid;
  }, [host, invite]);

  const eventName = useMemo(() => {
    if (!invite) return "Your Event";
    if (Array.isArray(invite.theme) && invite.theme.length > 0) return invite.theme.join(" • ");
    if (typeof invite.theme === "string" && invite.theme.trim().length > 0) return invite.theme.trim();
    if (Array.isArray(invite.eventType) && invite.eventType.length > 0) return invite.eventType.join(", ");
    return "Your Event";
  }, [invite]);

  const dateLabel = invite?.date?.trim() || "Date to be decided";
  const timeLabel = useMemo(() => {
    if (!invite) return "Time to be decided";
    if (invite.startTime && invite.endTime) return `${invite.startTime} – ${invite.endTime}`;
    if (invite.startTime) return invite.startTime;
    if (invite.endTime) return invite.endTime;
    return "Time to be decided";
  }, [invite]);

  const locationLabel = invite?.location?.trim() || "Location to be decided";

  const invitees = useMemo(() => (Array.isArray(invite?.invitees) ? invite!.invitees! : []), [invite]);
  const activities = useMemo(
    () => (Array.isArray(invite?.activities) ? invite!.activities!.slice().sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")) : []),
    [invite]
  );

  const rsvpSummary = useMemo(() => {
    // RSVP tracking not implemented yet, so everyone remains in "No response" for now.
    const total = invitees.length;
    return { going: 0, maybe: 0, declined: 0, noResponse: total };
  }, [invitees.length]);

  const hostDisplayName = useMemo(() => {
    if (host?.displayName) return host.displayName;
    if (host?.email) return host.email.split("@")[0];
    return "host";
  }, [host]);

  const handleSignOutForMismatch = async () => {
    await signOut(auth).catch(() => undefined);
    const redirectTarget = inviteId ? `/host/events/${inviteId}` : "/host/events";
    navigate(`/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`);
  };

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
        <PillButton to="/">Back to start</PillButton>
      </div>
    );
  }

  if (!inviteBelongsToHost) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Event Dashboard</h1>
        <p className="text-sm text-red-600">
          This invite belongs to a different host account. Sign out and log in with the correct username to continue.
        </p>
        <PillButton type="button" onClick={handleSignOutForMismatch}>
          Sign out and switch accounts
        </PillButton>
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
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dateLabel} • {timeLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {locationLabel}
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Signed in as {hostDisplayName}</p>
        </div>
        <div className="flex gap-2">
          <PillButton className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </PillButton>
          <PillButton className="flex items-center gap-2" to="/">
            <Plus className="h-4 w-4" />
            New Event
          </PillButton>
        </div>
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />RSVP Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between gap-4">
            <Stat label="Going" value={rsvpSummary.going} />
            <Stat label="Maybe" value={rsvpSummary.maybe} />
            <Stat label="Declined" value={rsvpSummary.declined} />
            <Stat label="No response" value={rsvpSummary.noResponse} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4" />Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <a key={action.id} href={action.href} className="text-sm text-blue-600 hover:underline">
                {action.label}
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              {locationLabel}
            </div>
            <div className="text-xs text-gray-500 mt-2">Map preview coming soon.</div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id ?? activity.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{activity.name || "Untitled activity"}</span>
                  <span className="text-gray-500">{activity.time || "TBD"}</span>
                </div>
              ))
            ) : (
              <div className="w-full rounded-xl bg-gray-100 px-4 py-12 text-center text-sm text-gray-500">
                No activities scheduled yet. Add them on the Activities page.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => (
                <div key={`upcoming-${activity.id ?? activity.name}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{activity.time || "TBD"}</span>
                  <span className="font-medium">{activity.name || "Untitled activity"}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Your plan will appear here once you add activities.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {invite?.customMessage && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Host Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{invite.customMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
