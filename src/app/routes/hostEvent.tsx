/**
 * Host event dashboard – displays a saved invitation and lets hosts preview/edit key fields.
 */
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Users, ListChecks, Plus, Eye, Pencil } from "lucide-react";
// import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc, getDocs, updateDoc, addDoc, collection, onSnapshot, serverTimestamp, type DocumentData } from "firebase/firestore";
import PillButton from "src/app/utils/pillButton";
import PollCard from "../components/PollCard";
import { auth, db } from "../lib/firebase";
import { useInvitation } from "../utils/invitationContext";
import { useAuth } from "../utils/authContext";
import { signOut } from "firebase/auth";

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
  activities?: Array<{ id?: string; name?: string; time?: string }>;
  customMessage?: string;
}

const QUICK_LINKS = [
  { id: "event-name", label: "Edit event name", to: "/eventName" },
  { id: "date-time", label: "Edit date & time", to: "/dateTime" },
  { id: "location", label: "Edit location", to: "/location" },
  //{ id: "invitees", label: "Manage invitees", to: "/invitee" },
  { id: "activities", label: "Edit activities", to: "/activity" },
];

const VIVA_STORAGE_KEYS = [
  "viva:eventName",
  "viva:partyType",
  "viva:theme",
  "viva:dateTime",
  "viva:activityState",
  "viva:location",
];

export default function HostEvent(): ReactElement {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const {
    setEventName,
    setEventType,
    setTheme,
    setDate,
    setStartTime,
    setEndTime,
    setActivities,
  } = useInvitation();

  // const [host, setHost] = useState<User | null>(auth.currentUser);
  // const [authReady, setAuthReady] = useState(false);
  const { host, authReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDoc | null>(null);
  const [editingField, setEditingField] = useState<'none' | 'name' | 'location' | 'message'>('none');
  const [savingField, setSavingField] = useState<'name' | 'location' | 'message' | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [rsvpSummary, setRsvpSummary] = useState({
    going: 0,
    maybe: 0,
    declined: 0,
    noResponse: 0,
  });
  const [rsvpByGuest, setRsvpByGuest] = useState<Record<string, "yes" | "maybe" | "no">>({});

  const [polls, setPolls] = useState<Array<{ id: string; question: string; options: Array<{ id: string; label: string }>; isActive: boolean }>>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  useEffect(() => {
    if (authReady && !host) {
      const redirectTarget = inviteId ? `/host/events/${inviteId}` : "/host/events";
      navigate(`/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
    }
  }, [authReady, host, inviteId, navigate]);

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
        if (!cancelled) {
          const data = snap.data() as InviteDoc;
          setInvite(data);
          setDraftName(data.eventName ?? "");
          setDraftLocation(data.location ?? "");
          setDraftMessage(typeof data.customMessage === "string" ? data.customMessage : "");
        }
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
  if (!inviteId || !invite) return;
  const guestsRef = collection(db, "invites", inviteId, "guests");
  console.log("👀 Listening to:", `invites/${inviteId}/guests`);

  const unsub = onSnapshot(guestsRef, (snapshot) => {
    let going = 0, maybe = 0, declined = 0;
    const nextByGuest: Record<string, "yes" | "maybe" | "no"> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.attending === "yes") {
        going++;
        nextByGuest[docSnap.id] = "yes";
      } else if (data.attending === "maybe") {
        maybe++;
        nextByGuest[docSnap.id] = "maybe";
      } else if (data.attending === "no") {
        declined++;
        nextByGuest[docSnap.id] = "no";
      }
    });
    console.log("📡 Live update:", { going, maybe, declined });
    setRsvpByGuest(nextByGuest);
    setRsvpSummary({ going, maybe, declined, noResponse: 0 });
  });

    return () => unsub();
  }, [inviteId, invite]);

  useEffect(() => {
    if (!inviteId) return;
    const pollsRef = collection(db, "invites", inviteId, "polls");
    const unsub = onSnapshot(pollsRef, (snapshot) => {
      const pollList = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { question: string; options: Array<{ id: string; label: string }>; isActive: boolean }),
      }));
      setPolls(pollList);
    });
    return () => unsub();
  }, [inviteId]);

  const handleCreatePoll = async () => {
    if (!inviteId || !pollQuestion.trim()) return;
    const validOptions = pollOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      alert("Add at least 2 options");
      return;
    }
    await addDoc(collection(db, "invites", inviteId, "polls"), {
      question: pollQuestion.trim(),
      options: validOptions.map((label, i) => ({ id: `opt-${i}`, label: label.trim() })),
      isActive: true,
      createdAt: serverTimestamp(),
    });
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollForm(false);
  };

  const handleTogglePoll = async (pollId: string, newState: boolean) => {
    if (!inviteId) return;
    await updateDoc(doc(db, "invites", inviteId, "polls", pollId), { isActive: newState });
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;

    return `${displayHour}:${m.toString().padStart(2, "0")} ${suffix}`;
  };
  
  const inviteBelongsToHost = useMemo(() => {
    if (!host || !invite) return true;
    if (!invite.hostUid) return true;
    return invite.hostUid === host.uid;
  }, [host, invite]);

  const eventName = useMemo(() => {
    if (!invite) return "Your Event";
    if (typeof invite.eventName === "string" && invite.eventName.trim()) return invite.eventName.trim();
    if (Array.isArray(invite.theme) && invite.theme.length) return invite.theme.join(" • ");
    if (typeof invite.theme === "string" && invite.theme.trim()) return invite.theme.trim();
    if (Array.isArray(invite.eventType) && invite.eventType.length) return invite.eventType.join(", ");
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
  const noResponseCount = useMemo(() => {
    if (!invitees.length) return 0;
    let responded = 0;
    invitees.forEach((name) => {
      if (rsvpByGuest[name]) responded++;
    });
    return Math.max(invitees.length - responded, 0);
  }, [invitees, rsvpByGuest]);

  const comingGuests = useMemo(() => {
    return Object.entries(rsvpByGuest)
      .filter(([_, status]) => status === "yes" || status === "maybe")
      .sort(([a], [b]) => a.localeCompare(b));
  }, [rsvpByGuest]);

  const declinedGuests = useMemo(() => {
    return Object.entries(rsvpByGuest)
      .filter(([_, status]) => status === "no")
      .sort(([a], [b]) => a.localeCompare(b));
  }, [rsvpByGuest]);
  const activities = useMemo(() => {
    if (!Array.isArray(invite?.activities)) return [];

    return invite.activities
      .slice()
      .sort((a, b) => {
        const ta = typeof a.time === "number" ? a.time : 0;
        const tb = typeof b.time === "number" ? b.time : 0;
        return ta - tb;
      });
  }, [invite]);

  const eventTypeLabel = useMemo(() => {
    if (!invite) return "Not specified";
    if (Array.isArray(invite.eventType) && invite.eventType.length > 0) return invite.eventType.join(", ");
    return "Not specified";
  }, [invite]);

  const themeLabel = useMemo(() => {
    if (!invite) return "No theme selected";
    if (Array.isArray(invite.theme) && invite.theme.length > 0) return invite.theme.join(" • ");
    if (typeof invite.theme === "string" && invite.theme.trim().length > 0) return invite.theme.trim();
    return "No theme selected";
  }, [invite]);

  // const rsvpSummary = useMemo(() => {
  //   const total = invitees.length;
  //   return { going: 0, maybe: 0, declined: 0, noResponse: total };
  // }, [invitees.length]);

  const hostDisplayName = useMemo(() => {
    if (host?.displayName) return host.displayName;
    if (host?.email) return host.email.split("@")[0];
    return "host";
  }, [host]);

  const inviteUrl = useMemo(() => {
    if (!inviteId) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/guest/${inviteId}`;
  }, [inviteId]);

  const guestPreviewPath = inviteId ? `/guest/${inviteId}` : null;

  const mapSrc = useMemo(() => {
    if (!invite?.location) return null;
    const query = encodeURIComponent(invite.location);
    return `https://maps.google.com/maps?q=${query}&z=15&output=embed`;
  }, [invite?.location]);

  const updateInvite = async (updates: Partial<InviteDoc>, field: 'name' | 'location' | 'message') => {
    if (!inviteId) return;
    setSavingField(field);
    try {
      await updateDoc(doc(db, "invites", inviteId), updates);
      setInvite((prev) => (prev ? { ...prev, ...updates } : prev));
      setEditingField('none');
    } catch (err) {
      console.error("Failed to update invite", err);
    } finally {
      setSavingField(null);
    }
  };

  const handleSignOutForMismatch = async () => {
    await signOut(auth).catch(() => undefined);
    const redirectTarget = inviteId ? `/host/events/${inviteId}` : "/host/events";
    navigate(`/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const handleCreateNewEvent = async () => {
    VIVA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    setEventName("");
    setEventType([]);
    setTheme([]);
    setDate("");
    setStartTime("");
    setEndTime("");
    setActivities([]);
    navigate("/", { replace: true });  // 去掉 signOut，直接跳转
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="flex-1 space-y-3">
          {editingField === 'name' ? (
            <form
              className="flex flex-col gap-3 max-w-xl"
              onSubmit={(e) => {
                e.preventDefault();
                const value = draftName.trim();
                if (!value) return;
                updateInvite({ eventName: value }, 'name');
              }}
            >
              <label className="text-xs uppercase tracking-wide text-gray-500">Event title</label>
              <input
                className="border rounded-lg px-4 py-2 text-2xl font-semibold"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={100}
                required
              />
              <div className="flex gap-2">
                <PillButton type="submit" disabled={savingField === 'name'}>
                  {savingField === 'name' ? 'Saving…' : 'Save title'}
                </PillButton>
                <PillButton
                  type="button"
                  onClick={() => {
                    setEditingField('none');
                    setDraftName(invite?.eventName ?? '');
                  }}
                >
                  Cancel
                </PillButton>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{eventName}</h1>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  onClick={() => setEditingField('name')}
                >
                  <Pencil className="h-4 w-4" /> Edit title
                </button>
              </div>
              <p className="text-gray-500 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateLabel} • {timeLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {locationLabel}
                </span>
              </p>
            </div>
          )}
          <p className="text-xs text-gray-400">Signed in as {hostDisplayName}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {guestPreviewPath && (
            <PillButton className="flex items-center gap-2" to={guestPreviewPath}>
              <Eye className="h-4 w-4" /> Preview Invite
            </PillButton>
          )}
          <PillButton className="flex items-center gap-2" type="button" onClick={handleCreateNewEvent}>
            <Plus className="h-4 w-4" /> Create New Event
          </PillButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white shadow">
          <div className="p-4 border-b font-semibold inline-flex items-center gap-2">
            <Users className="h-4 w-4" /> Event Snapshot
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500">Event type</h3>
              <p className="mt-1 font-medium text-gray-800">{eventTypeLabel}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500">Theme</h3>
              <p className="mt-1 font-medium text-gray-800">{themeLabel}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500">Guests added</h3>
              <p className="mt-1 font-medium text-gray-800">{invitees.length}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500">Date & time</h3>
              <p className="mt-1 font-medium text-gray-800">{dateLabel} • {timeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow">
          <div className="p-4 border-b font-semibold inline-flex items-center gap-2 text-gray-800">
            <Users className="h-4 w-4" /> RSVP Overview
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-600">Going</p>
              <p className="text-2xl font-semibold text-gray-900">{rsvpSummary.going}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-600">Maybe</p>
              <p className="text-2xl font-semibold text-gray-900">{rsvpSummary.maybe}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-600">Declined</p>
              <p className="text-2xl font-semibold text-gray-900">{rsvpSummary.declined}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-600">No response</p>
              <p className="text-2xl font-semibold text-gray-900">{noResponseCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="font-semibold inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location & Map
            </span>
            {editingField !== 'location' && (
              <button
                type="button"
                className="text-xs text-blue-600 inline-flex items-center gap-1"
                onClick={() => setEditingField('location')}
              >
                <Pencil className="h-3 w-3" /> Edit location
              </button>
            )}
          </div>
          <div className="p-4 space-y-3 text-sm">
            {editingField === 'location' ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = draftLocation.trim();
                  if (!value) return;
                  updateInvite({ location: value }, 'location');
                }}
              >
                <label className="text-xs uppercase tracking-wide text-gray-500">Location</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  maxLength={200}
                  required
                />
                <div className="flex justify-end gap-2">
                  <PillButton type="button" onClick={() => { setEditingField('none'); setDraftLocation(invite?.location ?? ""); }}>
                    Cancel
                  </PillButton>
                  <PillButton type="submit" disabled={savingField === 'location'}>
                    {savingField === 'location' ? 'Saving…' : 'Save'}
                  </PillButton>
                </div>
              </form>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                  {locationLabel}
                </div>
                {mapSrc ? (
                  <div className="w-full overflow-hidden rounded-xl border border-gray-200">
                    <iframe
                      title="Event location map"
                      src={mapSrc}
                      width="100%"
                      height="200"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="border-0"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl bg-gray-100 px-4 py-8 text-center text-xs text-gray-500">
                    Add a location to preview it on the map.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white shadow">
          <div className="p-4 border-b font-semibold inline-flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Quick Links
          </div>
          <div className="p-4 space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.id}
                to={link.to}
                state={{ mode: "edit", inviteId }}
                className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-gray-50 text-blue-600"
              >
                <span>{link.label}</span>
                <span className="text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow lg:col-span-2">
          <div className="p-4 border-b font-semibold">Timeline</div>
          <div className="p-4 space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id ?? activity.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{activity.name || "Untitled activity"}</span>
                  <span className="text-gray-500">{typeof activity.time === "number" ? formatMinutes(activity.time) : "TBD"}</span>
                </div>
              ))
            ) : (
              <div className="w-full rounded-xl bg-gray-100 px-4 py-12 text-center text-sm text-gray-500">
                No activities scheduled yet. Add them on the Activities page.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow">
        <div className="p-4 border-b font-semibold">Who's Coming</div>
        <div className="p-4 space-y-3 text-sm">
          {comingGuests.length > 0 ? (
            <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
              {comingGuests.map(([guest, status]) => {
                const statusLabel = status === "yes" ? "Going" : "Maybe";
                const statusClass = status === "yes"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700";

                return (
                  <div key={guest} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span>{guest}</span>
                    <span className={`text-xs border rounded-full px-2 py-0.5 ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No RSVP responses yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow">
        <div className="p-4 border-b font-semibold">Declined</div>
        <div className="p-4 space-y-3 text-sm">
          {declinedGuests.length > 0 ? (
            <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
              {declinedGuests.map(([guest]) => (
                <div key={guest} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>{guest}</span>
                  <span className="text-xs border rounded-full px-2 py-0.5 border-rose-200 bg-rose-50 text-rose-700">
                    Declined
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No declines yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Host Message
          </span>
          {editingField !== 'message' && (
            <button
              type="button"
              className="text-xs text-blue-600 inline-flex items-center gap-1"
              onClick={() => setEditingField('message')}
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
        <div className="p-4 space-y-3 text-sm">
          {editingField === 'message' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateInvite({ customMessage: draftMessage }, 'message');
              }}
            >
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={4}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <PillButton type="button" onClick={() => { setEditingField('none'); setDraftMessage(typeof invite?.customMessage === 'string' ? invite!.customMessage! : ''); }}>
                  Cancel
                </PillButton>
                <PillButton type="submit" disabled={savingField === 'message'}>
                  {savingField === 'message' ? 'Saving…' : 'Save'}
                </PillButton>
              </div>
            </form>
          ) : (
            <p className="text-gray-700 whitespace-pre-line">
              {invite?.customMessage || 'Add a custom note for your guests.'}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold">Polls</span>
          <PillButton type="button" onClick={() => setShowPollForm(!showPollForm)}>
            {showPollForm ? "Cancel" : "+ New Poll"}
          </PillButton>
        </div>
        <div className="p-4 space-y-4">
          {showPollForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreatePoll();
              }}
              className="space-y-3 border rounded-xl p-4"
            >
              <input
                placeholder="Poll question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...pollOptions];
                      copy[i] = e.target.value;
                      setPollOptions(copy);
                    }}
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <PillButton type="button" onClick={() => setPollOptions([...pollOptions, ""])}>
                  + Add Option
                </PillButton>
                <PillButton type="submit">Create Poll</PillButton>
              </div>
            </form>
          )}
          {polls.length > 0
            ? polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  pollId={poll.id}
                  question={poll.question}
                  options={poll.options}
                  isActive={poll.isActive}
                  inviteId={inviteId!}
                  isHost
                  onToggleActive={handleTogglePoll}
                />
              ))
            : !showPollForm && (
                <p className="text-gray-500 text-sm">No polls yet. Create one to engage your guests.</p>
              )}
        </div>
      </div>
    </div>
  );
}
