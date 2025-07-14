// src/pages/Confirm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvitation } from "../utils/invitationContext"; // context holding event info
import { db } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import PillButton from "../utils/pillButton";

export default function Confirmation() {
  const [customMessage, setCustomMessage] = useState("");
  const invitationData = useInvitation();
  const navigate = useNavigate();

const handleConfirm = async () => {
  try {
    const cleanData = Object.fromEntries(
      Object.entries(invitationData).filter(([_, v]) => typeof v !== "function")
    );

    const newInvite = {
      ...cleanData,
      customMessage,
      timestamp: new Date(),
    };

    console.log("Cleaned invite:", newInvite);

    const docRef = await addDoc(collection(db, "invites"), newInvite);
    console.log("Invite saved! ID:", docRef.id);
    navigate(`/guest/${docRef.id}`);
  } catch (error) {
    console.error("Error saving invite:", error);
  }
};
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">🎉 Review & Confirm</h1>
      {/* Display summary here */}
      <textarea
        placeholder="Leave a message for your guests..."
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
      <PillButton onClick={handleConfirm}>
         Confirm & Generate Link
      </PillButton>
    </div>
  );
}