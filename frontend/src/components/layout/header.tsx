import { useLocation, Link } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useNavigate } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Jobs",
  "/jobs/create": "Create Job",
  "/executions": "Executions",
  "/logs": "Logs",
  "/monitoring": "Monitoring",
  "/settings": "Settings",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = "";

  for (const seg of segments) {
    path += `/${seg}`;
    const label = PAGE_TITLES[path] ?? (seg.length > 20 ? seg.slice(0, 8) + "…" : seg.charAt(0).toUpperCase() + seg.slice(1));
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-56 right-0 h-12 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md z-30">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
