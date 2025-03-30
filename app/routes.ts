import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("invitee", "routes/invitee.tsx"),
  route("location", "routes/location.tsx"),
  route("dateTime", "routes/dateTime.tsx"),
  route("activity", "routes/activity.tsx"),
  route("partyType", "routes/partyType.tsx"),
  route("theme", "routes/theme.tsx"),
] satisfies RouteConfig;
