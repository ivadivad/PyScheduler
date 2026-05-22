import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 ring-2 ring-primary/20 mx-auto mb-6">
          <Zap className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-7xl font-black text-foreground/10 mb-2">404</h1>
        <h2 className="text-xl font-bold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/dashboard">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
