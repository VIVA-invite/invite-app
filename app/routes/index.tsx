import { Link } from "react-router";

const sections = [
  { label: "Invitees", path: "/invitees" },
  { label: "Location", path: "/location" },
  { label: "Date & Time", path: "/dateTime" },
  { label: "Activities", path: "/activity" },
];

export default function Index() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-3xl font-bold mb-10 text-black">Create Your Invite</h1>
      <div className="flex items-center gap-4">
        {sections.map((section, index) => (
          <div key={section.path} className="flex items-center">
            <Link
              to={section.path}
              className="px-4 py-2 rounded-full border-2 font-medium text-sm bg-white 
                text-black border-gray-300 hover:border-indigo-500 transition-all duration-300"
            >
              {section.label}
            </Link>
            {index < sections.length - 1 && (
              <div className="w-10 h-0.5 bg-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
