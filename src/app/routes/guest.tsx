/**
 * The final guest page where users can copy the invitation link
 */
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PillButton from "../utils/pillButton";

export default function Guest() {
  const { inviteId } = useParams();
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if(!inviteId) return;
      const docSnap = await getDoc(doc(db, "invites", inviteId));
      if (docSnap.exists()) {
        setInviteData(docSnap.data());
      }
    };
    fetchInvite();
  }, [inviteId]);

  const currentUrl = window.location.href;

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">You're Invited!</h1>
      {inviteData ? (
        <>
          <p><strong>Type:</strong> {inviteData.type}</p>
          <p><strong>Theme:</strong> {inviteData.theme}</p>
          <p><strong>Date:</strong> {inviteData.date}</p>
          <p><strong>Location:</strong> {inviteData.location}</p>
          {inviteData.customMessage && (
            <p className="italic">💬 {inviteData.customMessage}</p>
          )}
          <hr />
          <p className="text-sm text-gray-500">Link to this invite:</p>
          <input
            readOnly
            value={currentUrl}
            className="w-full border rounded-lg px-3 py-1"
          />
          <PillButton
            onClick={() => navigator.clipboard.writeText(currentUrl)}
          >
            Copy Link 📋
          </PillButton>

          <br /> <br />
          <p className="text-sm text-gray-500">Want to save progress?</p>
          <br />
          <PillButton to={`/hostLogIn?redirect=${encodeURIComponent(location.pathname)}`}>
            Log in as a Host
          </PillButton>

        </>
      ) : (
        <p>Loading invitation...</p>
      )}
    </div>
  );
}