import { Bell, Search } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Sidebar with soft drop shadow */}
      <Sidebar permissions={session.permissions} roles={session.roles} />
      
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Glassmorphic Top Header */}
        <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-border/40 bg-background/60 py-0 pl-20 pr-4 backdrop-blur-xl transition-all lg:px-6">
          <div className="flex flex-col justify-center">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selamat bekerja</div>
            <div className="text-base font-bold text-foreground">{session.name}</div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Modern Search Bar */}
            <div className="hidden h-10 w-[320px] items-center gap-3 rounded-full border border-input bg-background/50 px-4 text-sm text-muted-foreground shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 hover:bg-background xl:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Cari karyawan, approval, dokumen..." 
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            {/* Notification Button */}
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-input bg-background/50 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground" aria-label="Notifikasi">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
            </button>
            <ThemeToggle />
            
            {/* Logout Form/Button */}
            <form action="/api/auth/logout" method="post">
              <button className="h-10 rounded-full border border-input bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">Logout</button>
            </form>
          </div>
        </header>
        
        {/* Main Content Padding */}
        <div className="flex-1 p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
