import { Link } from "react-router-dom";

interface PillButtonInterface {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function PillButton({ to, children, className = "" }: PillButtonInterface) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-full border-2 font-medium text-sm bg-white 
                text-black border-gray-300 hover:border-indigo-500 transition-all duration-300 ${className}`}
    >
      {children}
    </Link>
  );
}


