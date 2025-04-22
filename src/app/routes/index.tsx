import PillButton from "src/app/utils/pillButton";

const sections = [
  { label: "Type", path: "/partyType" },
  { label: "Theme", path: "/theme" },
  { label: "Date & Time", path: "/dateTime" },
  { label: "Activities", path: "/activity" },
  { label: "Invitees", path: "/invitee" },
  { label: "Location", path: "/location" },
];

export default function Index() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <h1 className="text-3xl font-bold mb-10">Create Your Invite</h1>
      <div className="flex items-center gap-4 flex-wrap justify-center">
        {sections.map((section, index) => (
          <div key={section.path} className="flex items-center">
            <PillButton to={section.path}>
              {section.label}
            </PillButton>
            {index < sections.length - 1 && (
              <div className="w-10 h-0.5 bg-border mx-2" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}