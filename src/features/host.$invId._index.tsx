import { useParams, Link } from "react-router";

export default function HostDashboardPlaceholder() {
  const { invId } = useParams();
  return (
    <main style={{ padding: 24 }}>
      <h1>Host Dashboard (placeholder)</h1>
      <p>Invitation: <b>{invId}</b></p>
      <div style={{ marginTop: 16 }}>
        <Link to={`/host/${invId}/login`}>Go to Login</Link>{" · "}
        <Link to={`/host/${invId}/signup`}>Go to Signup</Link>
      </div>
    </main>
  );
}
