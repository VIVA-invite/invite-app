/**
 * Where current invitation data are stored before entering the database
 */
import React, { createContext, useContext, useState } from "react";

type Activity = {
  id: string;
  name: string;
  time: string; // in hh:mm
};

type InvitationData = {
  eventName: string;
  setEventName: (value: string) => void;

  eventType: string[];
  setEventType: (value: string[]) => void;

  theme: string[];
  setTheme: (value: string[]) => void;

  location: string;
  setLocation: (value: string) => void;

  date: string | null;
  setDate: (value: string) => void;

  startTime: string | null;
  setStartTime: (value: string) => void;

  endTime: string | null;
  setEndTime: (value: string) => void;

  invitees: string[];
  setInvitees: (value: string[]) => void;

  activities: Activity[];
  setActivities: (value: Activity[]) => void;
};

const InvitationContext = createContext<InvitationData | undefined>(undefined);

export const InvitationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventName, setEventName] = useState<string>("");
  const [eventType, setEventType] = useState<string[]>([]);
  const [theme, setTheme] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  return (
    <InvitationContext.Provider
      value={{
        eventType,
        setEventType,
        eventName,
        setEventName,
        theme,
        setTheme,
        location,
        setLocation,
        date,
        setDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
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
