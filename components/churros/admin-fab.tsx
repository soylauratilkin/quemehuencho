"use client"

import { useState, useEffect } from "react"
import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminFab() {
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Verificar si está logueada
    const checkAuth = () => {
      const auth = sessionStorage.getItem("qh_admin") === "true"
      setIsAuth(auth)
    }
    
    checkAuth()
    
    // Verificar cada vez que la ventana recibe foco
    window.addEventListener("focus", checkAuth)
    return () => window.removeEventListener("focus", checkAuth)
  }, [])

  // Si NO está logueada, NO mostrar el botón
  if (!isAuth) return null

  return (
    <button
      onClick={() => router.push("/admin/pedidos")}
      className="fixed bottom-24 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-2xl ring-2 ring-[#ff751f]/50 transition-transform active:scale-95 md:hidden"
      aria-label="Volver al Admin"
    >
      <Lock className="size-5" />
    </button>
  )
}