import SuperDashboardShell from "@/components/layout/super-dashboard-shell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperDashboardShell>{children}</SuperDashboardShell>
}
