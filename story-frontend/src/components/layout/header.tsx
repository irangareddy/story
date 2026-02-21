import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Library" },
  { to: "/voices", label: "Voices" },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link to="/" className="mr-8 text-lg font-bold">
          Story
        </Link>
        <nav className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.to
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
