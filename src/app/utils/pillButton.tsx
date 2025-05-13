import { cn } from "src/app/lib/utils";
import { Link } from "react-router-dom";

interface PillButtonProps extends React.PropsWithChildren, React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
  isSelected?: boolean;
  className?: string;
}

export default function PillButton({ to, className, children, isSelected, onClick, ...props }: PillButtonProps) {
  const baseClasses =
    "animate-fadeIn px-4 py-2 rounded-full border font-medium text-sm transition-all duration-300";
  const selectedClasses = isSelected
    ? "bg-primary text-primary-foreground"
    : "border-border bg-background text-foreground hover:bg-muted";

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