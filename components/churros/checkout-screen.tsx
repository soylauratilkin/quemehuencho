"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Banknote, CreditCard, Link2, LocateFixed } from "lucide-react"
import { formatPrice, calcularPrecioEnvio, fetchConfig, DEFAULT_CONFIG } from "@/lib/menu-data"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

const payments = [
  { id: "Efectivo", label: "Efectivo", note: "Pagás al recibir", icon: Banknote },
  { id: "Mercado Pago", label: "Mercado Pago", note: "Te enviamos el link", icon: Link2 },
  { id: "Transferencia", label: "Transferencia", note: "Compartinos el comprobante", icon: CreditCard },
]

// ⚠️ PEGÁ ACÁ LA URL DE TU APPS SCRIPT (la que termina en /exec)
const WEBHOOK_URL = ""

export function CheckoutScreen() {
  const { subtotal, items, placeOrder, setScreen, orderDetails, setOrderDetails } = useStore()
  
  // 1. Cargar datos guardados del navegador (LocalStorage)
  const [address, setAddress] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qh_address") || orderDetails?.address || ""
    }
    return orderDetails?.address || ""
  })
  
  const [phone, setPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qh_phone") || orderDetails?.phone || ""
    }
    return orderDetails?.phone || ""
  })

  const [payment, setPayment] = useState(orderDetails?.paymentMethod || "Transferencia")
  const [notes, setNotes] = useState(orderDetails?.notes || "")
  const [isCalculating, setIsCalculating] = useState(false)
  const [distanceKm, setDistanceKm] = useState(orderDetails?.distanceKm || 0)
  const [deliveryFee, setDeliveryFee] = useState(orderDetails?.deliveryFee || 0)
  const [error, setError] = useState("")
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  useEffect(() => {
    fetchConfig().then(setConfig)
  }, [])

  const total = subtotal + deliveryFee

  // 2. Calcular distancia con OpenStreetMap (gratis)
  async function calcularDistanciaReal(direccionDestino: string): Promise<number | null> {
    try {
      const response = await fetch(
        `/api/distance?destino=${encodeURIComponent(direccionDestino)}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en la API:", errorData)
        setError(`Error: ${errorData.error || "No se pudo calcular"}`)
        return null
      }

      const data = await response.json()
      return data.distancia
    } catch (error) {
      console.error("Error calculando distancia:", error)
      setError("Error de conexión. Intentá de nuevo.")
      return null
    }
  }

  async function useMyLocation() {
    setIsCalculating(true)
    setError("")

    if (!address.trim()) {
      setError("Primero escribí tu dirección arriba.")
      setIsCalculating(false)
      return
    }

    try {
      const distancia = await calcularDistanciaReal(address)
      
      if (distancia === null) {
        setIsCalculating(false)
        return
      }

      setDistanceKm(distancia)
      
      const fee = calcularPrecioEnvio(distancia)
      if (fee) {
        setDeliveryFee(fee)
      } else {
        setError("Lo sentimos, estás fuera de nuestra zona de delivery (máx 10 km).")
      }
    } catch (err) {