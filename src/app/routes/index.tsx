import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PillButton from "src/app/utils/pillButton";
import { useAuth } from "../utils/authContext";

const sections = [
  { label: "Event Name", path: "/eventName" },
  { label: "Type", path: "/partyType" },
  { label: "Theme", path: "/theme" },
  { label: "Date & Time", path: "/dateTime" },
  { label: "Activities", path: "/activity" },
  { label: "Location", path: "/location" },
  { label: "Review", path: "/confirmation" },
];

export default function Index() {
  const { host, authReady } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    if (host) {
      navigate(path);
      return;
    }
    if (!authReady) return;
    setPendingPath(path);
    setShowLoginPrompt(true);
  };

  return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-background px-4">
        <h1 className="text-3xl font-bold mb-10 text-black">Create Your Invite</h1>
        <div className="absolute top-4 right-4">
          <PillButton type="button" onClick={() => handleNavigate("/host")}>
            Dashboard
          </PillButton>
        </div>
        <div className="flex items-center flex-wrap gap-2 justify-center">
          {sections.map((section, index) => (
              <div key={section.path} className="flex items-center gap-2">
                <PillButton type="button" onClick={() => handleNavigate(section.path)}>
                  {section.label}
                </PillButton>
                {index < sections.length - 1 && (
                    <div className="w-10 h-px bg-gray-300 mx-2" />
                )}
              </div>
          ))}
        </div>

        {showLoginPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
                <h2 className="text-xl font-semibold">Log in to continue</h2>
                <p className="text-sm text-gray-600">
                  You need a host account before creating an invite. We'll bring you back after you log in.
                </p>
                <div className="flex flex-col gap-2">
                  <PillButton
                      type="button"
                      onClick={() => {
                        const target = pendingPath ?? "/eventName";
                        navigate(`/hostLogIn?redirect=${encodeURIComponent(target)}`);
                      }}
                  >
                    Log in / Sign up
                  </PillButton>
                  <PillButton
                      type="button"
                      onClick={() => {
                        setShowLoginPrompt(false);
                        setPendingPath(null);
                      }}
                  >
                    Cancel
                  </PillButton>
                </div>
              </div>
            </div>
        )}
      </main>
  );
}