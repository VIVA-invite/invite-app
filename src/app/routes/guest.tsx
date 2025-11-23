/**
 * The final guest page where users can copy the invitation link
 */
import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import PillButton from "../utils/pillButton";

type Guest = {
  attending: boolean;
  bringing: number;
}
export default function Guest() {
  const { inviteId } = useParams();
  const location = useLocation();
  const [inviteData, setInviteData] = useState<any>(null);
  const [attending, setAttending] = useState<"yes" | "no" | "maybe" | null>(null);
  const [bringing, setBringing] = useState<number>(0);
  const [guestName, setGuestName] = useState("");

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

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;

    return `${displayHour}:${m.toString().padStart(2, "0")} ${suffix}`;
  };
  
  useEffect(() => {
    if (attending !== "yes") {
      setBringing(0);
    }
  }, [attending]);

  const currentUrl = window.location.href;
  const redirectTarget = inviteId ? `/host/events/${inviteId}` : "/host/events";
  const loginHref = `/hostLogIn?redirect=${encodeURIComponent(redirectTarget)}`;
  
   const handleSubmitRSVP = async () => {
    if (!inviteId) {
      alert("Invalid invitation link.");
      return;
    }
    if (!guestName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!attending) {
      alert("Please select if you are attending.");
      return;
    }

    try {
      const guestRef = doc(db, "invites", inviteId, "guests", guestName);
      await setDoc(guestRef, {
        attending,
        bringing: attending === "yes" ? bringing : 0,
        respondedAt: new Date(),
      });
      console.log("✅ Writing to path:", `invites/${inviteId}/guests/${guestName}`);
      alert("Your RSVP has been saved!");
    } catch (error) {
      console.error("Error saving RSVP:", error);
      alert("Failed to save RSVP. Please try again.");
    }
  };


  return (
  

    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{inviteData?.eventName || "You're Invited!"}</h1>
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
          {inviteData.location && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
              <iframe
                title="Event location map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(inviteData.location)}&z=15&output=embed`}
                width="100%"
                height="200"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0"
                allowFullScreen
              />
            </div>
          )}
          {Array.isArray(inviteData.activities) && inviteData.activities.length > 0 ? (
            <div>
              <p><strong>Activities:</strong></p>

              <ul className="mt-2 space-y-1">
                {inviteData.activities.map((act: any, i: number) => (
                  <li key={i} className="text-gray-700">
                    {formatMinutes(act.time)} — {act.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p><strong>Activities:</strong> No activities listed</p>
          )}
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
          <p><strong>What is your name?</strong></p>
          <input
            type="text"
            placeholder="Your name"
            className="border px-2 py-1 rounded w-1/3"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />

          <hr />
          <p><strong>Are you attending?</strong></p>
          <div className = "flex gap-2">
            <PillButton onClick={() => setAttending("yes")}
                        className={attending === "yes" ? "border-2 border-gray-500 font-semibold" : "border"}
            >
              Yes
            </PillButton>

            <PillButton onClick={() => setAttending("no")}
                        className={attending === "no" ? "border-2 border-gray-500 font-semibold" : "border"}
            >
              No
            </PillButton>

            <PillButton onClick={() => setAttending("maybe")}
                        className={attending === "maybe" ? "border-2 border-gray-500 font-semibold" : "border"}
            >
              Maybe
            </PillButton>
          </div>
          
          {attending === "yes" && (
            <>
              <p>Bringing people?</p>

              <PillButton
                onClick={() => setBringing(1)}
                className={
                  bringing === 1
                    ? "border-2 border-gray-500 font-medium"
                    : "border border-gray-300"
                }
              >
                +1
              </PillButton>
            </>
          )}

          <hr />
          <div className = "flex gap-2">
            <PillButton onClick={handleSubmitRSVP}>Submit RSVP</PillButton>
          </div>
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
