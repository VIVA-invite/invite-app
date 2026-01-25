import { useParams, Link } from "react-router";

export default function HostSignupRoute() {
  const { invId } = useParams();
  return (
    <main style={{ padding: 24 }}>
      <h1>Create Host Account</h1>
      <p>Invitation: <b>{invId}</b></p>
      {/* form comes next */}
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to={`/host/${invId}/login`}>Log in</Link>
      </p>
    </main>
  );
}
