"use client";
import Link from "next/link";
import NotifyEngine from "./NotifyEngine";
import SyncEngine from "./SyncEngine";
import PwaRegister from "./PwaRegister";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, ListChecks, Settings, Clock, CalendarDays, Timer, GraduationCap, LineChart, Bell, Briefcase, BarChart3, BookOpen, Folder, User } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "My Goals", icon: Target },
  { href: "/planner", label: "Daily Planner", icon: Clock },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/exams", label: "Examinations", icon: GraduationCap },
  { href: "/mocks", label: "Mock Tests", icon: LineChart, Bell, Briefcase, BarChart3, BookOpen, Folder, User },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase, BarChart3, BookOpen, Folder, User },
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/focus", label: "Focus Mode", icon: Timer, GraduationCap, LineChart, Bell, Briefcase, BarChart3, BookOpen, Folder, User },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reviews", label: "Reviews", icon: BookOpen, Folder, User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/account", label: "Account & Sync", icon: User },
];
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen md:flex">
      <nav className="flex gap-1 border-b border-line p-2 md:min-h-screen md:w-52 md:flex-col md:border-b-0 md:border-r md:p-4">
        <div className="hidden px-2 pb-4 text-base font-semibold md:block">Life OS</div>
        {nav.map(({ href, label, icon: Icon }) => {
          const on = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm ${on ? "bg-accent/10 text-accent" : "text-mute hover:text-ink"}`}>
              <Icon size={16} /> {label}
            </Link>
          );
        })}
      </nav>
      <NotifyEngine />
      <SyncEngine />
      <PwaRegister />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
