/** 
 * Host log in page 
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import PillButton from "../utils/pillButton";
import { auth, db } from "../lib/firebase";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const HOST_EMAIL_DOMAIN = "hosts.viva-invite.app";

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const usernameToEmail = (username: string) => `${username}@${HOST_EMAIL_DOMAIN}`;

function buildUniqueEmail(username: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${username}+${suffix}@${HOST_EMAIL_DOMAIN}`;
}

export default function HostLogIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("redirect") || "/confirm";
  }, [location.search]);

  const inviteId = useMemo(() => {
    const match = /^\/host\/events\/([^/?#]+)/.exec(redirect);
    return match ? match[1] : null;
  }, [redirect]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState<User | null>(auth.currentUser);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [inviteUsername, setInviteUsername] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [inviteHostUid, setInviteHostUid] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // if already logged in, bounce to redirect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setExistingUser(u);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (inviteId && existingUser && inviteHostUid && existingUser.uid === inviteHostUid) {
      navigate(redirect, { replace: true });
    }
  }, [inviteId, existingUser, inviteHostUid, navigate, redirect]);

  useEffect(() => {
    if (!inviteId) {
      setInviteUsername(null);
      setInviteEmail(null);
      return;
    }
    setInviteLoading(true);
    setErr(null);
    getDoc(doc(db, "invites", inviteId))
      .then((snap) => {
        if (!snap.exists()) {
          throw new Error("Invite not found.");
        }
        const data = snap.data() as { hostUsername?: string | null; hostEmail?: string | null; hostUid?: string | null };
        setInviteUsername(data.hostUsername ?? null);
        setInviteEmail(data.hostEmail ?? null);
        setInviteHostUid(data.hostUid ?? null);
        if (data.hostUsername) {
          setUsername((prev) => prev || data.hostUsername || "");
        }
      })
      .catch((error: unknown) => {
        setErr((error as { message?: string }).message ?? "Unable to load invite details.");
      })
      .finally(() => setInviteLoading(false));
  }, [inviteId]);

  const handleSignOut = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signOut(auth);
    } catch (error) {
      setErr("Failed to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const callFn = async (fnName: "signIn" | "signUp") => {
    setErr(null);
    if (inviteLoading) {
      setErr("Still loading event details. Please wait a moment.");
      return;
    }

    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername || !password) {
      setErr("Please enter both username and password.");
      return;
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setErr("Usernames must be 3-30 characters using letters, numbers, dots, underscores, or dashes.");
      return;
    }
    setBusy(true);

    try {
      if (fnName === "signIn") {
        if (inviteId) {
          if (inviteUsername && normalizeUsername(inviteUsername) !== normalizedUsername) {
            throw new FirebaseError("auth/invalid-credential", "Username does not match this invitation.");
          }
          if (!inviteEmail) {
            throw new FirebaseError("auth/missing-email", "Host email not found for this invite.");
          }
          await signInWithEmailAndPassword(auth, inviteEmail, password);
        } else {
          await signInWithEmailAndPassword(auth, usernameToEmail(normalizedUsername), password);
        }
      } else {
        const email = buildUniqueEmail(normalizedUsername);
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;
        if (user) {
          await Promise.all([
            updateProfile(user, { displayName: normalizedUsername }).catch(() => undefined),
            setDoc(
              doc(db, "hosts", user.uid),
              {
                username: normalizedUsername,
                email,
                createdAt: serverTimestamp(),
              },
              { merge: true }
            ),
          ]);
        }
      }
      navigate(redirect, { replace: true });
    } catch (error) {
      let message = "Unexpected error. Please try again.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/user-not-found":
            message = "Username doesn't exist, please create an account.";
            break;
          case "auth/wrong-password":
          case "auth/invalid-credential":
            message = "Username or password is incorrect.";
            break;
          case "auth/email-already-in-use":
            message = "That username is already taken. Try a different one.";
            break;
          case "auth/missing-email":
            message = "We couldn't find host login details for this invite.";
            break;
          case "auth/weak-password":
            message = "Password must be at least 6 characters long.";
            break;
          case "auth/too-many-requests":
            message = "Too many attempts. Please wait and try again.";
            break;
          case "auth/operation-not-allowed":
            message = "Email/password sign-in is disabled for this project. Enable it in Firebase Authentication settings.";
            break;
        }
        if (error.code === "auth/invalid-credential" && inviteId) {
          message = "Username or password is incorrect for this invite.";
        }
      }
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  if (checkingAuth || (inviteId && inviteLoading)) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-bold">Host Log In</h1>
        <p className="text-sm text-gray-600">{inviteId ? "Loading event access…" : "Checking your session…"}</p>
      </div>
    );
  }

  if (existingUser) {
    const displayName = existingUser.displayName || existingUser.email?.split("@")[0] || "host";
    const viewingSpecificInvite = Boolean(inviteId);
    const goBackTarget = viewingSpecificInvite && inviteId ? `/host/events/${inviteId}` : redirect;
    return (
      <div className="max-w-md mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-bold">You're already signed in</h1>
        <p className="text-sm text-gray-600">
          Signed in as <strong>{displayName}</strong>.
          {" "}
          {viewingSpecificInvite
            ? "This invite is linked to a different host login. Sign out to switch accounts."
            : "Each invitation uses its own username and password—continue where you left off, or sign out to start a new one."}
        </p>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex flex-col gap-3 pt-1">
          <PillButton type="button" onClick={() => navigate(goBackTarget, { replace: true })} disabled={busy}>
            Return to your invite
          </PillButton>
          <PillButton type="button" onClick={handleSignOut} disabled={busy}>
            {busy ? "Signing out..." : "Sign out to create a new invite"}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Host Log In</h1>
      <p className="text-sm text-gray-600">
        {inviteId && inviteUsername
          ? <>Enter the <strong>{inviteUsername}</strong> host username and its password to manage this invite.</>
          : <>Choose a <strong>username</strong> and <strong>password</strong> for this invitation. Usernames can be reused on other invites—we’ll keep them unique for this event.</>}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium">Username</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={busy}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Password</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={busy}
            required
            minLength={6}
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex flex-col gap-3 pt-1">
          <PillButton
            type="button"
            onClick={() => callFn("signIn")}
            disabled={busy}
          >
            {busy ? "Checking..." : inviteId ? "Open invite" : "Log In"}
          </PillButton>

          {!inviteId && (
            <PillButton
              type="button"
              onClick={() => callFn("signUp")}
              disabled={busy}
            >
              {busy ? "Creating..." : "Create Account"}
            </PillButton>
          )}
        </div>
      </form>

      <p className="text-xs text-gray-500">
        {inviteId
          ? "Need to switch hosts? Sign out first, then log back in with the correct username."
          : "Tip: you can reuse a username on another invite—each one is isolated."}
      </p>
    </div>
  );
}
