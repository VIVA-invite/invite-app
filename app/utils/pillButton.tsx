import { Link } from "react-router-dom";

interface PillButtonInterface {
  to?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function PillButton({ to, children, className = "", onClick, isSelected = false}: PillButtonInterface) {
  const baseClass = `px-4 py-2 rounded-full border-2 font-medium text-sm transition-all duration-300
    ${isSelected ? "bg-sky-100 border-sky-500 text-sky-700" : "bg-white text-black border-gray-300 hover:border-sky-500"}
    ${className}`;

  if (to) {
    return (
      <Link to={to} className={baseClass}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClass}>
      {children}
    </button>
  );
}
