import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MRT Academic</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Academic Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl shadow-black/5 p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} MRT Academic. All rights reserved.
        </p>
      </div>
    </div>
  );
}
