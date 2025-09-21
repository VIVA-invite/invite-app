/** 
 * Host log in page 
 */

// src/routes/hostLogIn.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import PillButton from "../utils/pillButton";
import { auth, db } from "../lib/firebase";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const HOST_EMAIL_DOMAIN = "hosts.viva-invite.app";

const normalizeUsername = (value: string) => value.trim().toLowerCase();
const usernameToEmail = (username: string) => `${username}@${HOST_EMAIL_DOMAIN}`;

export default function HostLogIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("redirect") || "/confirm";
  }, [location.search]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // if already logged in, bounce to redirect
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate(redirect, { replace: true });
    });
    return () => unsub();
  }, [navigate, redirect]);

  const callFn = async (fnName: "signIn" | "signUp") => {
    setErr(null);
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
    const email = usernameToEmail(normalizedUsername);
    try {
      if (fnName === "signIn") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
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
      }
      setErr(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Host Log In</h1>
      <p className="text-sm text-gray-600">
        Use your self-defined <strong>username</strong> and <strong>password </strong> 
        to save and restore invitations across devices.
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
            placeholder="your_name"
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
            autoComplete="current-password"
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
            {busy ? "Logging in..." : "Log In"}
          </PillButton>

          <PillButton
            type="button"
            onClick={() => callFn("signUp")}
            disabled={busy}
          >
            {busy ? "Creating..." : "Create Account"}
          </PillButton>
        </div>
      </form>

      <p className="text-xs text-gray-500">
        By creating an account, you agree that your invitations will be stored in your Viva account.
      </p>
    </div>
  );
}
