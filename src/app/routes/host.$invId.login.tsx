import { useParams, Link } from "react-router";

export default function HostLoginRoute() {
  const { invId } = useParams();
  return (
    <main style={{ padding: 24 }}>
      <h1>Host Login</h1>
      <p>Invitation: <b>{invId}</b></p>
      {/* form comes next */}
      <p style={{ marginTop: 16 }}>
        New host? <Link to={`/host/${invId}/signup`}>Create account</Link>
      </p>
    </main>
  );
}
