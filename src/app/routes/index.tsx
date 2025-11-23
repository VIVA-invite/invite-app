/**
 * Home page
 */
import PillButton from "src/app/utils/pillButton";

const sections = [
  { label: "Event Name", path: "/eventName" },
  { label: "Type", path: "/partyType" },
  { label: "Theme", path: "/theme" },
  { label: "Date & Time", path: "/dateTime" },
  { label: "Activities", path: "/activity" },
  // { label: "Invitees", path: "/invitee" },
  { label: "Location", path: "/location" },
  { label: "Review", path: "/confirmation" },
];

export default function Index() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-3xl font-bold mb-10 text-black">Create Your Invite</h1>
      <div className="flex items-center flex-wrap gap-2 justify-center">
        {sections.map((section, index) => (
          <div key={section.path} className="flex items-center gap-2">
            <PillButton to={section.path}>
              {section.label}
            </PillButton>
            {index < sections.length - 1 && (
              <div className="w-10 h-px bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
