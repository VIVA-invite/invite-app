/**
 * VIVA button: should be used throughout the app if possible
 */
import { cn } from "src/app/lib/utils";
import { Link } from "react-router-dom";

interface PillButtonProps extends React.PropsWithChildren, React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
  isSelected?: boolean;
  className?: string;
}

export default function PillButton({ to, className, children, isSelected, onClick, ...props }: PillButtonProps) {
  const baseClasses =
    "px-4 py-2 rounded-full font-medium text-sm bg-white text-black ring-0 transition-shadow duration-300 hover:ring-1 hover:ring-gray-300"
  const selectedClasses = isSelected
    ? "rounded-full px-4 py-2 text-sm ring-4 ring-gray-300 transition-shadow duration-300 hover:ring-2 hover:ring-gray-300"
    : "rounded-full px-4 py-2 text-sm ring-1 ring-gray-300 transition-shadow duration-300 hover:ring-2 hover:ring-gray-300";

  const fullClass = cn(baseClasses, selectedClasses, className);

  if (to) {
    return (
      <Link to={to} className={fullClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={fullClass} onClick={onClick} {...props}>
      {children}
    </button>
  );
}