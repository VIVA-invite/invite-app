/**
 * Page where users can type in invitee and invitee emails to send the invitation
 */
import { useEffect, useState } from "react";
import PillButton from "src/app/utils/pillButton";

type Invitee = {
  name: string;
  email: string;
};

const STORAGE_KEY = "viva:invitees";

export default function Invitee() {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          invitees?: Invitee[];
          name?: string;
          email?: string;
        };
        if (Array.isArray(saved.invitees)) setInvitees(saved.invitees);
        if (typeof saved.name === "string") setName(saved.name);
        if (typeof saved.email === "string") setEmail(saved.email);
      }
    } catch {}
    finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ invitees, name, email })
    );
  }, [hydrated, invitees, name, email]);

  const handleAddInvitee = () => {
    if (!name || !email) return;
    setInvitees([...invitees, { name, email }]);
    setName("");
    setEmail("");
  };

  const handleRemoveInvitee = (index: number) => {
    setInvitees((prev) => prev.filter((_, i) => i !== index));
  };
  

  return (
    <main className="max-w-md mx-auto p-6 bg-background space-y-6">
        <div className="text-3xl font-bold mb-10 text-black flex items-center">Who’s coming</div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Name"
          className="border px-2 py-1 rounded w-1/3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border px-2 py-1 rounded w-1/3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleAddInvitee}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {invitees.map((inv, i) => {
            const nameCounts = invitees.reduce((count: Record<string, number>, curr) => {
                count[curr.name] = (count[curr.name] || 0) + 1;
                return count;
              }, {});
              
            const isDuplicate = nameCounts[inv.name] > 1;
            
            return (
                <div
                key={i}
                className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-2"
                >
                <span>
                    {inv.name}{isDuplicate ? ` (${inv.email})` : ""}
                </span>
                <button
                    onClick={() => handleRemoveInvitee(i)}
                    className="text-red-500 font-bold"
                >
                    ×
                </button>
                </div>
            );
            })}
      </div>

        {/* Finish button */}
      {invitees.length > 0 && (
        <div className="mt-4">
            <button
            onClick={() => {setShowToast(true);
                setShowModal(true);
                setTimeout(() => setShowToast(false), 3000);
            }} // placeholder for now
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
            Finish
            </button>
        </div>
        )}

        {/* Toast Message */}
        {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg
            transition-opacity duration-500 opacity-100 animate-fadeIn">
            You're ready to send invites!
        </div>
        )}

        
        {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50
                animate-fadeIn">
            <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Review Your Invite</h2>
            <ul className="mb-4 max-h-40 overflow-y-auto">
                {invitees.map((inv, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                    {inv.name} ({inv.email})
                </li>
                ))}
            </ul>
            <textarea
                placeholder="Write your custom message here..."
                className="w-full border rounded p-2 mb-4"
                rows={3}
            />
            <div className="flex justify-end gap-2">
                <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black"
                >
                Cancel
                </button>
                <button
                onClick={() => {
                    console.log("Sending emails...");
                    setShowModal(false);
                }}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >
                Send
                </button>
            </div>
            </div>
        </div>
        )}

        <div className="fixed bottom-6 right-6 flex gap-2">
          <PillButton to="/">Home</PillButton>
          <PillButton to="/location">Next</PillButton>
        </div>
    </main>
  );
}
