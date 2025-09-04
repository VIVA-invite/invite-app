/**
 * Where current invitation data are stored before entering the database. For when2meet version
 */
import React, { createContext, useContext, useState } from "react";

type Activity = {
  id: string;
  name: string;
  time: string; // in hh:mm
};

type InvitationData = {
  eventType: string[];
  setEventType: (value: string[]) => void;

  theme: string;
  setTheme: (value: string) => void;

  location: string;
  setLocation: (value: string) => void;

  startDateTime: string | null;
  setStartDateTime: (value: string) => void;

  endDateTime: string | null;
  setEndDateTime: (value: string) => void;

  invitees: string[];
  setInvitees: (value: string[]) => void;

  activities: Activity[];
  setActivities: (value: Activity[]) => void;
};

const InvitationContext = createContext<InvitationData | undefined>(undefined);

export const InvitationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventType, setEventType] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [startDateTime, setStartDateTime] = useState<string | null>(null);
  const [endDateTime, setEndDateTime] = useState<string | null>(null);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  return (
    <InvitationContext.Provider
      value={{
        eventType,
        setEventType,
        theme,
        setTheme,
        location,
        setLocation,
        startDateTime,
        setStartDateTime,
        endDateTime,
        setEndDateTime,
        invitees,
        setInvitees,
        activities,
        setActivities,
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
};

export const useInvitation = () => {
  const context = useContext(InvitationContext);
  if (!context) {
    throw new Error("useInvitation must be used within an InvitationProvider");
  }
  return context;
};
