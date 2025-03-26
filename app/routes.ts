import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("invitees", "routes/invitee.tsx"),
  route("location", "routes/location.tsx"),
  route("activities", "routes/activity.tsx"),
] satisfies RouteConfig;
