import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextValue {
    host: User | null;
    authReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ host: null, authReady: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [host, setHost] = useState<User | null>(auth.currentUser);
    const [authReady, setAuthReady] = useState(auth.currentUser !== null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setHost(user);
            setAuthReady(true);
        });
        return () => unsub();
    }, []);

    return (
        <AuthContext.Provider value={{ host, authReady }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);