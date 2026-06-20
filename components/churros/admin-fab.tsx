"use client"

import { useState } from "react"
import { Lock, X } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminFab() {
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const ADMIN_TOKEN = "queme2026admin"

  function handleLogin() {
    if (password === ADMIN_TOKEN) {
      sessionStorage.setItem("qh_admin", "true")
      router.push("/admin/pedidos")
    } else {
      setError("Contraseña incorrecta")
      setPassword("")
    }
  }

  // Si ya está logueado, mostrar botón directo
  const isAuth = typeof window !== "undefined" && sessionStorage.getItem("qh_admin") === "true"

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button
        onClick={() => {
          if (isAuth) {
            router.push("/admin/pedidos")
          } else {
            setShowInput(true)
          }
        }}
        className="fixed bottom-24 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-[#1a1a1a] text-[#ff751f] shadow-2xl ring-2 ring-[#ff751f]/30 transition-transform active:scale-95 md:hidden"
        aria-label="Modo Admin"
      >
        <Lock className="size-5" />
      </button>

      {/* MODAL DE LOGIN */}
      {showInput && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 md:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-[#111] p-6 ring-1 ring-[#333]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Acceso Admin</h3>
              <button
                onClick={() => { setShowInput(false); setError(""); setPassword("") }}
                className="flex size-8 items-center justify-center rounded-full bg-[#1a1a1a] text-gray-400"
              >
                <X className="size-4" />
              </button>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Contraseña"
              className="h-12 w-full rounded-2xl bg-[#1a1a1a] px-4 text-white outline-none ring-1 ring-[#333] focus:ring-2 focus:ring-[#ff751f]"
              autoFocus
            />

            {error && <p className="mt-2 text-sm font-semibold text-red-400">{error}</p>}

            <button
              onClick={handleLogin}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#ff751f] font-bold text-black"
            >
              Ingresar
            </button>
          </div>
        </div>
      )}
    </>
  )
}