"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"

const ADMIN_TOKEN = "queme2026admin"

// Componente interno que usa useSearchParams (envuelto en Suspense)
function LoginForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token === ADMIN_TOKEN) {
      sessionStorage.setItem("qh_admin", "true")
      router.replace("/admin/pedidos")
    }
  }, [searchParams, router])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_TOKEN) {
      sessionStorage.setItem("qh_admin", "true")
      router.push("/admin/pedidos")
    } else {
      setError("Contraseña incorrecta")
    }
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 rounded-3xl bg-[#111] p-8 shadow-2xl ring-1 ring-[#333]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#ff751f]">
          <Lock className="size-8 text-black" />
        </div>
        <h1 className="text-2xl font-bold text-white">Acceso Admin</h1>
        <p className="mt-1 text-sm text-gray-400">Quemehuencho POS</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-300">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 w-full rounded-2xl bg-[#1a1a1a] px-4 text-white outline-none ring-1 ring-[#333] focus:ring-2 focus:ring-[#ff751f]"
          placeholder="••••••••"
          autoFocus
        />
      </div>

      {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center rounded-full bg-[#ff751f] font-bold text-black transition-transform active:scale-95"
      >
        Ingresar
      </button>
    </form>
  )
}

// Página principal que envuelve el formulario en Suspense
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a] p-4">
      <Suspense fallback={
        <div className="flex size-16 items-center justify-center rounded-full bg-[#ff751f]">
          <Lock className="size-8 text-black" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
