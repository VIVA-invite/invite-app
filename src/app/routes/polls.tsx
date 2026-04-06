import { useEffect, useState } from "react";
import { useInvitation } from "../utils/invitationContext";
import PillButton from "../utils/pillButton";

const STORAGE_KEY = "viva:polls";

export default function Polls() {
  const { polls, setPolls } = useInvitation();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPolls(parsed);
        }
      } catch {}
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  }, [polls]);

  const handleAddPoll = () => {
    if (!question.trim()) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      alert("Add at least 2 options");
      return;
    }
    setPolls([...polls, { question: question.trim(), options: validOptions.map((o) => o.trim()) }]);
    setQuestion("");
    setOptions(["", ""]);
  };

  const handleRemovePoll = (index: number) => {
    setPolls(polls.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Add Polls</h1>
      <p className="text-sm text-gray-500">
        Create polls for your guests to vote on. This step is optional.
      </p>

      {polls.length > 0 && (
        <div className="space-y-3">
          {polls.map((poll, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{poll.question}</p>
                <button
                  type="button"
                  onClick={() => handleRemovePoll(i)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {poll.options.map((opt, j) => (
                  <li key={j} className="rounded-lg bg-gray-50 px-3 py-1">{opt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 border rounded-xl p-4">
        <input
          placeholder="Poll question (e.g. Pizza or BBQ?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => {
                const copy = [...options];
                copy[i] = e.target.value;
                setOptions(copy);
              }}
              className="flex-1 border rounded-lg px-3 py-2"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <PillButton type="button" onClick={() => setOptions([...options, ""])}>
            + Add Option
          </PillButton>
          <PillButton type="button" onClick={handleAddPoll}>
            Add Poll
          </PillButton>
        </div>
      </div>

      <div className="flex gap-2">
        <PillButton to="/">Home</PillButton>
        <PillButton to="/confirmation">Next</PillButton>
      </div>
    </div>
  );
}
