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

  // No mostrar navegación en login
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      {/* ========================================= */}
      {/* SIDEBAR - SOLO EN DESKTOP                 */}
      {/* ========================================= */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-full w-64 flex-col border-r border-[#222] bg-[#0a0a0a]">
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

      {/* ========================================= */}
      {/* CONTENEDOR PRINCIPAL (header + main + nav)*/}
      {/* ========================================= */}
      <div className="flex min-h-dvh flex-col md:ml-64">
        
        {/* HEADER MÓVIL - Arriba de todo */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-center border-b border-[#222] bg-[#0a0a0a]/95 backdrop-blur-md px-3 py-2">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Quemehuencho" className="h-7 w-7 rounded-full" />
            <div className="leading-tight">
              <h2 className="text-xs font-bold text-[#ff751f]">Quemehuencho</h2>
              <p className="text-[9px] text-gray-400">Modo Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="absolute right-3 flex size-8 items-center justify-center rounded-full bg-[#1a1a1a] text-gray-400 hover:text-red-400"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>

        {/* BOTTOM NAV - Solo en móvil */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#222] bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-1 px-2 py-2">
            <button
              onClick={() => router.push("/admin/pedidos")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                pathname === "/admin/pedidos"
                  ? "bg-[#ff751f] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ClipboardList className="size-5" />
              <span className="text-[10px] font-bold">Pedidos</span>
            </button>

            <button
              onClick={() => router.push("/admin/nuevo")}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors ${
                pathname === "/admin/nuevo"
                  ? "bg-[#ff751f] text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <PlusCircle className="size-5" />
              <span className="text-[10px] font-bold">Nuevo</span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-gray-400 transition-colors hover:text-white"
            >
              <Home className="size-5" />
              <span className="text-[10px] font-bold">App</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}