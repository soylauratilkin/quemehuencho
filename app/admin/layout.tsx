"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ClipboardList, PlusCircle, Home, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isAuth = sessionStorage.getItem("qh_admin") === "true"
    if (!isAuth && pathname !== "/admin/login") {
      router.push("/admin/login")
    }
  }, [pathname, router])

  function handleLogout() {
    sessionStorage.removeItem("qh_admin")
    router.push("/admin/login")
  }

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh bg-[#0a0a0a]">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#222] bg-[#0a0a0a]">
        <div className="flex items-center gap-3 border-b border-[#222] px-6 py-4">
          <img src="/images/logo.png" alt="Quemehuencho" className="h-10 w-10 rounded-full" />
          <div>
            <h2 className="text-sm font-bold text-[#ff751f]">Quemehuencho</h2>
            <p className="text-xs text-gray-400">Modo Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          <button
            onClick={() => router.push("/admin/pedidos")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
              pathname === "/admin/pedidos" ? "bg-[#ff751f] text-black" : "text-gray-300 hover:bg-[#1a1a1a]"
            }`}
          >
            <ClipboardList className="size-5" />
            <span className="font-bold">Pedidos Activos</span>
          </button>

          <button
            onClick={() => router.push("/admin/nuevo")}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
              pathname === "/admin/nuevo" ? "bg-[#ff751f] text-black" : "text-gray-300 hover:bg-[#1a1a1a]"
            }`}
          >
            <PlusCircle className="size-5" />
            <span className="font-bold">Nuevo Pedido</span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-300 transition-colors hover:bg-[#1a1a1a]"
          >
            <Home className="size-5" />
            <span className="font-bold">Ver App Pública</span>
          </button>
        </nav>

        <div className="border-t border-[#222] p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-400 transition-colors hover:bg-[#1a1a1a] hover:text-red-400"
          >
            <LogOut className="size-5" />
            <span className="font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  )
}