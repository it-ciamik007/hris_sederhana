import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  Gauge,
  House,
  MessageCircle,
  Receipt,
  ScanLine,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet
} from "lucide-react";

export const myNavigationItems = [
  { href: "/my", label: "Dashboard Saya", icon: House },
  { href: "/my/profile", label: "Profil Saya", icon: UserRound },
  { href: "/my/leave", label: "Cuti Saya", icon: CalendarDays },
  { href: "/my/overtime", label: "Lembur Saya", icon: Clock },
  { href: "/my/reimbursement", label: "Reimbursement Saya", icon: Receipt },
  { href: "/my/attendance", label: "Absensi Saya", icon: CalendarCheck },
  { href: "/my/approvals", label: "Approval Saya", icon: BadgeCheck },
  { href: "/my/evaluations", label: "Penilaian Saya", icon: ClipboardList },
  { href: "/my/payroll", label: "Payroll Saya", icon: Wallet }
] as const;

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, permission: "employee.view" },
  { href: "/employees", label: "Employees", icon: Users, permission: "employee.view" },
  { href: "/leave/requests", label: "Leave", icon: CalendarDays, permission: "leave.view" },
  { href: "/approvals", label: "Approvals", icon: BadgeCheck, permission: "approval.view" },
  { href: "/attendance/import", label: "Attendance", icon: ClipboardCheck, permission: "attendance.view" },
  { href: "/evaluations/forms", label: "Evaluations", icon: FileText, permission: "evaluation.result.view" },
  { href: "/tests/scan", label: "Scan OCR", icon: ScanLine, permission: "test.check" },
  { href: "/settings/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "whatsapp.manage" },
  { href: "/overtime", label: "Overtime", icon: Clock, permission: "leave.view" },
  { href: "/reimbursement", label: "Reimbursement", icon: Receipt, permission: "payroll.view" },
  { href: "/payroll/periods", label: "Payroll", icon: BriefcaseBusiness, permission: "payroll.view" },
  { href: "/announcements", label: "Announcements", icon: Bell, permission: "document.view" },
  { href: "/settings/organization", label: "Organisasi", icon: Building2, permission: "setting.manage" },
  { href: "/settings/defaults", label: "Defaults", icon: Settings, permission: "setting.manage" },
  { href: "/settings/roles", label: "Access Control", icon: ShieldCheck, permission: "setting.manage" }
] as const;
