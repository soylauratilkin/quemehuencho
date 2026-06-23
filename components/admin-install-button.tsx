"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

export function AdminInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showButton, setShowButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar si ya está instalada
    const storageKey = "qh_pwa_admin_installed"
    const yaInstalada = localStorage.getItem(storageKey) === "true"
    
    if (yaInstalada) {
      setIsInstalled(true)
      return
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      localStorage.setItem(storageKey, "true")
      return
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowButton(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === "accepted") {
      setShowButton(false)
      setIsInstalled(true)
      localStorage.setItem("qh_pwa_admin_installed", "true")
    }
    
    setDeferredPrompt(null)
  }

  function handleClose() {
    setShowButton(false)
  }

  if (isInstalled || !showButton) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl bg-[#ff751f] p-4 shadow-2xl md:bottom-4 md:left-auto md:right-4 md:w-80">
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/20 text-white"
      >
        <X className="size-4" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-black">
          <Download className="size-6 text-[#ff751f]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-black">Instalar QMH POS</p>
          <p className="text-xs text-black/70">App admin en tu inicio</p>
        </div>
        <button
          onClick={handleInstall}
          className="rounded-full bg-black px-4 py-2 text-xs font-bold text-[#ff751f]"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}