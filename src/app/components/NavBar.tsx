import { Link } from "react-router-dom";
import PillButton from "../utils/pillButton";

export default function NavBar() {
  return (
    <nav className="p-4 flex justify-between items-center">
      {/* Left side: App name */}
      <div className="text-lg font-bold">
        <Link to="/">VIVA</Link>
      </div>

      {/* Right side: navigation links */}
      <div className="space-x-6">
        <PillButton to="/dashboard">
          My Dashboard
        </PillButton>
        <PillButton to="/settings">
          Settings
        </PillButton>
      </div>
    </nav>
  );
}
