import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { collection, doc, onSnapshot, query, where, orderBy, limit, updateDoc, type DocumentData } from "firebase/firestore";
import { Bell } from "lucide-react";
import PillButton from "src/app/utils/pillButton";
import { auth, db } from "src/app/lib/firebase";

type EventStatus = "draft" | "upcoming" | "past";
interface Rsvp { going: number; maybe: number; declined: number; unknown: number; }
interface UserEventCardDto {
  id: string;
  name: string;
  dateLabel: string;
  timeLabel?: string;
  locationText?: string;
  rsvp: Rsvp;
  status: EventStatus;
  updatedAt?: Date;
}

interface InviteDoc extends DocumentData {
  hostUid?: string;
  eventType?: string[];
  theme?: string | string[];
  location?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  eventName?: string;
  invitees?: string[];
  timestamp?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function UserDashboard(): React.ReactElement {
  const navigate = useNavigate();
  const [host, setHost] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [events, setEvents] = useState<UserEventCardDto[]>([]);
  const [filter, setFilter] = useState<EventStatus | "all">("all");
  const [q, setQ] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const notifRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setHost(user);
      setAuthReady(true);
      if (!user) {
        navigate("/hostLogIn?redirect=/host", { replace: true });
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!host) return;
    setLoading(true);
    setError(null);
    const qRef = query(
      collection(db, "invites"),
      where("hostUid", "==", host.uid)
    );
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const now = new Date();
        const nextEvents = snap.docs.map((docSnap) => {
          const data = docSnap.data() as InviteDoc;
          const eventName =
            (typeof data.eventName === "string" && data.eventName.trim()) ||
            (Array.isArray(data.theme) && data.theme.length ? data.theme.join(" • ") : "") ||
            (typeof data.theme === "string" && data.theme.trim()) ||
            (Array.isArray(data.eventType) && data.eventType.length ? data.eventType.join(", ") : "") ||
            "Your Event";

          const dateLabel = data.date?.trim() || "Date to be decided";
          const timeLabel = data.startTime && data.endTime
            ? `${data.startTime} – ${data.endTime}`
            : data.startTime || data.endTime || undefined;
          const locationText = data.location?.trim() || "Location to be decided";

          let status: EventStatus = "draft";
          if (data.date) {
            const dateObj = new Date(data.date);
            if (!Number.isNaN(dateObj.getTime())) {
              status = dateObj.getTime() >= now.getTime() ? "upcoming" : "past";
            }
          }

          const invitees = Array.isArray(data.invitees) ? data.invitees.length : 0;

          return {
            id: docSnap.id,
            name: eventName,
            dateLabel,
            timeLabel,
            locationText,
            status,
            rsvp: { going: 0, maybe: 0, declined: 0, unknown: invitees },
            updatedAt: data.updatedAt?.toDate?.() ?? data.timestamp?.toDate?.(),
          };
        });
        nextEvents.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
        setEvents(nextEvents);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load host dashboard invites", err);
        setError("Unable to load your events right now.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [host]);

  useEffect(() => {
    if (!host || events.length === 0) return;
    const unsubs = events.map((event) => {
      const notifsRef = collection(db, "invites", event.id, "notifications");
      return onSnapshot(
        query(notifsRef, orderBy("createdAt", "desc"), limit(20)),
        (snapshot) => {
          const eventNotifs = snapshot.docs.map((d) => ({
            id: d.id,
            eventId: event.id,
            ...d.data(),
          }));
          setNotifications((prev) => {
            const filtered = prev.filter((n) => n.eventId !== event.id);
            return [...filtered, ...eventNotifs].sort(
              (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
            );
          });
        }
      );
    });
    return () => unsubs.forEach((fn) => fn());
  }, [host, events]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  const handleMarkRead = async (notif: any) => {
    if (notif.read) return;
    const notifDocRef = doc(db, "invites", notif.eventId, "notifications", notif.id);
    await updateDoc(notifDocRef, { read: true });
  };

  const list = useMemo(() => {
    return events
      .filter(e => (filter === "all" ? true : e.status === filter))
      .filter(e => e.name.toLowerCase().includes(q.toLowerCase()));
  }, [events, filter, q]);

  if (!authReady || loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Your events</h1>
        <p className="text-sm text-gray-600">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Your events</h1>
        <p className="text-sm text-red-600">{error}</p>
        <PillButton to="/">Back to start</PillButton>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your events</h1>
        <div className="flex items-center gap-2">
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded-2xl shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={`${n.eventId}-${n.id}`}
                      className={`w-full text-left px-4 py-3 border-b text-sm hover:bg-gray-50 ${
                        !n.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleMarkRead(n)}
                    >
                      <p className="font-medium">
                        {n.guestName} RSVP'd "{n.attending}" to {n.eventName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {n.createdAt?.toDate?.()?.toLocaleString() ?? "Just now"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <PillButton to="/">New Event</PillButton>
          <PillButton
            type="button"
            onClick={async () => {
              setSigningOut(true);
              await signOut(auth).catch(() => undefined);
              setSigningOut(false);
              navigate("/", { replace: true });
            }}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Log out"}
          </PillButton>
        </div>
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
          return (
            <li key={e.id} className="rounded-2xl border bg-white shadow p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{e.name}</h2>
                  <p className="text-xs text-gray-500">
                    {e.status === "draft" ? "Draft" : e.dateLabel}
                    {e.timeLabel ? ` • ${e.timeLabel}` : ""}
                    {e.locationText ? ` • ${e.locationText}` : ""}
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
                <Link to={`/guest/${e.id}`} className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm">
                  View guest invite
                </Link>
                <Link to={`/host/events/${e.id}`} className="px-3 py-1 rounded-full border text-sm">
                  Host dashboard
                </Link>
              </div>

              {e.updatedAt && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Updated {e.updatedAt.toLocaleString()}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
