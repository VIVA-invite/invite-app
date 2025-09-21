/**
 * The final guest page where users can copy the invitation link
 */
import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PillButton from "../utils/pillButton";

type Guest = {
  attending: boolean;
  bringing: number;
}
export default function Guest() {
  const { inviteId } = useParams();
  const location = useLocation();
  const [inviteData, setInviteData] = useState<any>(null);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [bringing, setBringing] = useState<number>(0);

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
  const redirectTarget = `${location.pathname}${location.search}`;
  const loginHref = `/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`;

  {/* <pre className="text-xs bg-gray-50 p-2 rounded">
        {JSON.stringify(inviteData, null, 2)}
      </pre> */}

  return (
  

    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">You're Invited!</h1>
      {inviteData ? (
        <>
          {/* <p><strong>Type:</strong> {inviteData.eventType?.join(", ")}</p> */}
          {inviteData.eventType.length !== 0 ? (
            <p><strong>Type:</strong> {inviteData.eventType.join(", ")}</p>
          ) : (
            <p><strong>Type:</strong> No type specified</p>
          )}
          {inviteData.theme.length !== 0 ? (
            <p><strong>Theme:</strong> {inviteData.theme.join(", ")}</p>
          ) : (
            <p><strong>Theme:</strong> No theme specified</p>
          )}
          <p><strong>Time:</strong> {" "}{inviteData.date}, {inviteData.startTime} - {inviteData.endTime}</p>
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

          <hr />
          <p><strong>Are you attending?</strong></p>
          <div className = "flex gap-2">
            <PillButton onClick={() => setAttending("yes")}>Yes</PillButton>
            <PillButton onClick={() => setAttending("no")}>No</PillButton>
          </div>
          

          {attending === "yes" && (
            <>
            <p>Bringing people?</p>
            <PillButton onClick={() => setBringing(1)}> +1</PillButton>
            </>
          )}
        </>
      ) : (
        <p>Loading invitation...</p>
      )}

      <div className="fixed top-6 right-6 flex gap-2">
        <PillButton to={loginHref}>Log in</PillButton>
      </div>
    </div>

    
  );
}
