/** 
 * Host log in page 
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import PillButton from "../utils/pillButton";
import { auth, db } from "../lib/firebase";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const HOST_EMAIL_DOMAIN = "hosts.viva-invite.app";

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const usernameToEmail = (username: string) => `${username}@${HOST_EMAIL_DOMAIN}`;

async function isUsernameTaken(username: string, currentUid?: string | null): Promise<boolean> {
  try {
    const hostQuery = query(
      collection(db, "hosts"),
      where("username", "==", username),
      limit(1)
    );
    const hostSnap = await getDocs(hostQuery);
    if (hostSnap.empty) return false;
    const existingId = hostSnap.docs[0]?.id;
    if (currentUid && existingId === currentUid) return false;
    return true;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "permission-denied") {
      // Rules may block list queries; fall back to auth email uniqueness.
      return false;
    }
    throw error;
  }
}

export default function HostLogIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("redirect") || "/host";
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
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);

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
      setNeedsUsername(false);
      setPendingUser(null);
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
        if (inviteId && inviteUsername && normalizeUsername(inviteUsername) !== normalizedUsername) {
          throw new FirebaseError("auth/invalid-credential", "Username does not match this invitation.");
        }
        if (inviteId && inviteEmail && !inviteEmail.endsWith(`@${HOST_EMAIL_DOMAIN}`)) {
          throw new FirebaseError("auth/operation-not-allowed", "This invite uses Google sign-in.");
        }
        const email = usernameToEmail(normalizedUsername);
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const email = usernameToEmail(normalizedUsername);
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const user = credential.user;
        if (user) {
          if (await isUsernameTaken(normalizedUsername, user.uid)) {
            await deleteUser(user).catch(() => undefined);
            throw new FirebaseError("auth/email-already-in-use", "That username is already taken.");
          }
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
      console.error("Host login error:", error);
      let message = "Unexpected error. Please try again.";
      const code = error instanceof FirebaseError
        ? error.code
        : (error as { code?: string | undefined }).code;
        if (code) {
          switch (code) {
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
            message = inviteId
              ? "We couldn't find host login details for this invite."
              : "We couldn't find host login details for this username.";
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
          case "permission-denied":
            message = "Firestore rules are blocking host account access. Allow authenticated users to read/write the hosts collection.";
            break;
        }
        if (code === "auth/invalid-credential") {
          const errorMessage = (error as { message?: string }).message ?? "";
          if (errorMessage.includes("multiple invites")) {
            message = "That username is used by multiple invites. Please use the invite link to sign in.";
          } else if (inviteId) {
            message = "Username or password is incorrect for this invite.";
          }
        }
        if (code === "auth/operation-not-allowed") {
          const errorMessage = (error as { message?: string }).message ?? "";
          if (errorMessage.includes("Google sign-in")) {
            message = "This invite uses Google sign-in. Click “Continue with Google” below.";
          }
        }
      }
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErr(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user) {
        throw new Error("Google sign-in failed.");
      }
      if (inviteId && inviteHostUid && user.uid !== inviteHostUid) {
        await signOut(auth).catch(() => undefined);
        setErr("This invite belongs to a different host account.");
        return;
      }

      const hostSnap = await getDoc(doc(db, "hosts", user.uid));
      const hostData = hostSnap.exists() ? (hostSnap.data() as { username?: string | null }) : null;
      const existingUsername = hostData?.username?.trim() || null;

      if (existingUsername) {
        if (!user.displayName || user.displayName !== existingUsername) {
          await updateProfile(user, { displayName: existingUsername }).catch(() => undefined);
        }
        navigate(redirect, { replace: true });
        return;
      }

      const suggested = normalizeUsername(user.displayName || user.email?.split("@")[0] || "");
      setUsername((prev) => prev || suggested);
      setPendingUser(user);
      setNeedsUsername(true);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErr("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClaimUsername = async () => {
    setErr(null);
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      setErr("Please choose a username.");
      return;
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setErr("Usernames must be 3-30 characters using letters, numbers, dots, underscores, or dashes.");
      return;
    }
    const user = pendingUser ?? auth.currentUser;
    if (!user) {
      setErr("Please sign in with Google again.");
      return;
    }

    setBusy(true);
    try {
      if (await isUsernameTaken(normalizedUsername, user.uid)) {
        setErr("That username is already taken. Try a different one.");
        return;
      }
      await Promise.all([
        updateProfile(user, { displayName: normalizedUsername }).catch(() => undefined),
        setDoc(
          doc(db, "hosts", user.uid),
          {
            username: normalizedUsername,
            email: user.email ?? null,
            createdAt: serverTimestamp(),
            provider: "google",
          },
          { merge: true }
        ),
      ]);
      setNeedsUsername(false);
      setPendingUser(null);
      navigate(redirect, { replace: true });
    } catch (error) {
      console.error("Username claim error:", error);
      setErr("Unable to save your username. Please try again.");
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

  if (existingUser && !needsUsername) {
    const displayName = existingUser.displayName || existingUser.email?.split("@")[0] || "host";
    const viewingSpecificInvite = Boolean(inviteId);
    const dashboardTarget = viewingSpecificInvite && inviteId ? `/host/events/${inviteId}` : redirect;
    return (
      <div className="max-w-md mx-auto p-6 space-y-5">
        <h1 className="text-2xl font-bold">You're already signed in</h1>
        <p className="text-sm text-gray-600">
          Signed in as <strong>{displayName}</strong>.
          {" "}
          {viewingSpecificInvite
            ? "This invite is linked to a different host login. Sign out to switch accounts."
            : "Continue to your dashboard, or sign out to switch accounts."}
        </p>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex flex-col gap-3 pt-1">
          <PillButton type="button" onClick={() => navigate(dashboardTarget, { replace: true })} disabled={busy}>
            Dashboard
          </PillButton>
          <PillButton type="button" onClick={handleSignOut} disabled={busy}>
            {busy ? "Signing out..." : "Sign out"}
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Host Log In</h1>
      <p className="text-sm text-gray-600">
        {needsUsername
          ? <>Choose a unique <strong>username</strong> to finish setting up your host account.</>
          : inviteId && inviteUsername
            ? <>Enter the <strong>{inviteUsername}</strong> host username and its password to manage this invite. If you signed up with Google, use the Google button below.</>
            : <>Choose a unique <strong>username</strong> and <strong>password</strong> for your host account. Usernames are unique across the entire site.</>}
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
        {!needsUsername && (
          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={inviteId ? "current-password" : "new-password"}
              disabled={busy}
              required
              minLength={6}
            />
          </div>
        )}

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex flex-col gap-3 pt-1">
          {needsUsername ? (
            <>
              <PillButton type="button" onClick={handleClaimUsername} disabled={busy}>
                {busy ? "Saving..." : "Save Username"}
              </PillButton>
              <PillButton type="button" onClick={handleSignOut} disabled={busy}>
                Sign out
              </PillButton>
            </>
          ) : (
            <>
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

              <PillButton
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
              >
                Continue with Google
              </PillButton>
            </>
          )}
        </div>
      </form>

      <p className="text-xs text-gray-500">
        {inviteId
          ? "Need to switch hosts? Sign out first, then log back in with the correct username."
          : "Tip: usernames are unique across Viva Invite. Pick one you want to keep."}
      </p>
    </div>
  );
}
