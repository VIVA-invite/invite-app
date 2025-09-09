/** 
 * Host log in page 
 */

// src/routes/hostLogIn.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import PillButton from "../utils/pillButton";

export default function HostLogIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return qs.get("redirect") || "/confirm";
  }, [location.search]);

  const auth = useMemo(() => getAuth(), []);
  const functions = useMemo(() => getFunctions(), []);

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
  }, [auth, navigate, redirect]);

  const callFn = async (fnName: "signIn" | "signUp") => {
    setErr(null);
    if (!username || !password) {
      setErr("Please enter both username and password.");
      return;
    }
    setBusy(true);
    try {
      const fn = httpsCallable(functions, fnName);
      const res = await fn({ username: username.trim(), password });
      const { token } = (res.data as any) || {};
      if (!token) throw new Error("No token returned from server.");
      await signInWithCustomToken(auth, token);
      navigate(redirect, { replace: true });
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("not-found")) {
        setErr("Username doesn't exist, please create an account.");
      } else if (msg.includes("permission-denied")) {
        setErr("Username or password is incorrect.");
      } else if (msg.includes("already-exists")) {
        setErr("That username is already taken. Try a different one.");
      } else {
        setErr("Unexpected error. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-bold">Host Log In</h1>
      <p className="text-sm text-gray-600">
        Use your self-defined <strong>username</strong> and <strong>password</strong> 
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
