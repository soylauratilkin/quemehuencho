import { AppShell } from "@/components/churros/app-shell"
import { AdminFab } from "@/components/churros/admin-fab"

export default function Page() {
  return (
    <div className="min-h-dvh w-full bg-secondary/40">
      <AppShell />
      {/* BOTÓN FLOTANTE ADMIN (solo móvil) */}
      <AdminFab />
    </div>
  )
}
