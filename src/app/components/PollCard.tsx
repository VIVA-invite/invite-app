import { useEffect, useState } from "react";
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import PillButton from "../utils/pillButton";

interface PollOption {
  id: string;
  label: string;
}

interface PollCardProps {
  pollId: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  inviteId: string;
  guestName?: string;
  isHost?: boolean;
  onToggleActive?: (pollId: string, newState: boolean) => void;
}

export default function PollCard({
  pollId,
  question,
  options,
  isActive,
  inviteId,
  guestName,
  isHost,
  onToggleActive,
}: PollCardProps) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVote, setMyVote] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const votesRef = collection(db, "invites", inviteId, "polls", pollId, "votes");
    const unsub = onSnapshot(votesRef, (snapshot) => {
      const counts: Record<string, number> = {};
      let total = 0;
      let guestVote: string | null = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const optId = data.optionId as string;
        counts[optId] = (counts[optId] || 0) + 1;
        total++;
        if (guestName && docSnap.id === guestName) {
          guestVote = optId;
        }
      });

      setVotes(counts);
      setTotalVotes(total);
      setMyVote(guestVote);
    });
    return () => unsub();
  }, [inviteId, pollId, guestName]);

  const handleVote = async (optionId: string) => {
    if (!guestName || myVote) return;
    const voteRef = doc(db, "invites", inviteId, "polls", pollId, "votes", guestName);
    await setDoc(voteRef, {
      optionId,
      votedAt: serverTimestamp(),
    });
  };

  const showResults = isHost || !!myVote;

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{question}</p>
        {isHost && onToggleActive && (
          <button
            type="button"
            onClick={() => onToggleActive(pollId, !isActive)}
            className={`text-xs px-2 py-1 rounded-full border ${
              isActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {isActive ? "Active" : "Closed"}
          </button>
        )}
      </div>

      {showResults ? (
        <div className="space-y-2">
          {options.map((opt) => {
            const count = votes[opt.id] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyChoice = myVote === opt.id;
            return (
              <div key={opt.id} className="relative h-8 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                    isMyChoice ? "bg-blue-200" : "bg-gray-200"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 px-3 text-sm leading-8 flex items-center justify-between">
                  <span>
                    {opt.label}
                    {isMyChoice && " (your vote)"}
                  </span>
                  <span className="text-gray-500">
                    {count} ({pct}%)
                  </span>
                </span>
              </div>
            );
          })}
          <p className="text-xs text-gray-400">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((opt) => (
            <PillButton
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left"
            >
              {opt.label}
            </PillButton>
          ))}
        </div>
      )}
    </div>
  );
}
