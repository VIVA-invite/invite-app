/**
 * Confirmation page where user creates the invitation
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInvitation } from "../utils/invitationContext"; // context holding event info
import { auth, db } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import PillButton from "../utils/pillButton";

const VIVA_STORAGE_KEYS = [
  "viva:eventName",
  "viva:partyType",
  "viva:theme",
  "viva:dateTime",
  "viva:activityState",
  "viva:location",
];

export default function Confirmation() {
  const [customMessage, setCustomMessage] = useState("");
  const invitationData = useInvitation();
  const navigate = useNavigate();
  const location = useLocation();
  const [host, setHost] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setHost(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      VIVA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const hostUsername = useMemo(() => {
    if (!host) return null;
    if (host.displayName) return host.displayName;
    if (host.email) return host.email.split("@")[0];
    return null;
  }, [host]);

  const handleConfirm = async () => {
    setErrorMessage(null);
    const trimmedEventName = invitationData.eventName?.trim() ?? "";
    if (!trimmedEventName) {
      setErrorMessage("Give your event a name before saving.");
      return;
    }
    if (!host) {
      setErrorMessage(
        "Create a host username and password before saving. Each invitation uses its own login."
      );
      return;
    }

    setSaving(true);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(invitationData).filter(([_, v]) => typeof v !== "function")
      );

      const newInvite = {
        ...cleanData,
        eventName: trimmedEventName,
        hostUid: host.uid,
        hostUsername,
        hostEmail: host.email,
        customMessage,
        timestamp: new Date(),
      };

      const docRef = await addDoc(collection(db, "invites"), newInvite);
      await signOut(auth).catch(() => undefined);

      VIVA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

      navigate(`/guest/${docRef.id}`);
    } catch (error) {
      console.error("Error saving invite:", error);
      setErrorMessage("We couldn't save this invite. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCustomMessage("");
    VIVA_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">🎉 Review & Confirm</h1>
      <textarea
        placeholder="Leave a message for your guests..."
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
      {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}

      <div className="flex gap-2">
        <PillButton type="button" onClick={handleReset}>
          Reset
        </PillButton>
        <PillButton onClick={handleConfirm} disabled={saving || !authReady}>
          {saving ? "Saving..." : "Confirm & Generate Link"}
        </PillButton>
      </div>

      <br />
      <br />
      <p className="text-sm text-gray-500">
        {host
          ? `Signed in as ${hostUsername ?? "your host account"}. Finishing will sign you out.`
          : "Need a host login? Create a new username and password for this invite."}
      </p>
      <div className="flex gap-2">
        <PillButton to={`/hostLogIn?redirect=${encodeURIComponent(location.pathname)}`}>
          {host ? "Switch host login" : "Log in as a Host"}
        </PillButton>

        <PillButton to="/">Home</PillButton>
      </div>
    </div>
  );
}
