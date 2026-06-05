import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gauge,
  MessageCircle,
  ScanLine,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, permission: "employee.view" },
  { href: "/employees", label: "Employees", icon: Users, permission: "employee.view" },
  { href: "/leave/requests", label: "Leave", icon: CalendarDays, permission: "leave.view" },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck, permission: "approval.view" },
  { href: "/attendance/import", label: "Attendance", icon: ClipboardCheck, permission: "attendance.view" },
  { href: "/evaluations/forms", label: "Evaluations", icon: FileText, permission: "evaluation.result.view" },
  { href: "/tests/scan", label: "Scan OCR", icon: ScanLine, permission: "test.check" },
  { href: "/settings/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "whatsapp.manage" },
  { href: "/payroll/periods", label: "Payroll", icon: BriefcaseBusiness, permission: "payroll.view" },
  { href: "/announcements", label: "Announcements", icon: Bell, permission: "document.view" },
  { href: "/settings/defaults", label: "Defaults", icon: Settings, permission: "setting.manage" },
  { href: "/settings/roles", label: "Access Control", icon: ShieldCheck, permission: "setting.manage" }
] as const;
