"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { calcularPrecioEnvio, formatPrice, type CategoryId } from "@/lib/menu-data"

export type Screen = "home" | "cart" | "checkout" | "success"

export type CartItem = {
  lineId: string
  productId: string
  name: string
  category: CategoryId
  unitPrice: number
  quantity: number
}

type PastOrder = {
  id: string
  date: string
  items: { name: string; quantity: number }[]
  productIds: string[]
  total: number
}

type OrderDetails = {
  address: string
  phone: string
  distanceKm: number
  deliveryFee: number
  paymentMethod: string
  notes: string
}

type StoreContextValue = {
  screen: Screen
  setScreen: (s: Screen) => void
  items: CartItem[]
  addItem: (item: Omit<CartItem, "lineId">) => void
  increment: (lineId: string) => void
  decrement: (lineId: string) => void
  removeItem: (lineId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  loyaltyPoints: number
  history: PastOrder[]
  reorder: (order: PastOrder) => void
  placeOrder: (details: OrderDetails) => void
  lastEta: number
  orderDetails: OrderDetails | null
  setOrderDetails: (details: OrderDetails) => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

const SAMPLE_HISTORY: PastOrder[] = []

export function StoreProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("home")
  const [items, setItems] = useState<CartItem[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(240)
  const [history, setHistory] = useState<PastOrder[]>(SAMPLE_HISTORY)
  const [lastEta, setLastEta] = useState(25)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)

  function addItem(item: Omit<CartItem, "lineId">) {
    setItems((prev) => {
      const signature = item.productId
      
      // BLINDAR: Asegurar que unitPrice sea un número válido
      const unitPrice = Number(item.unitPrice) || 0;
      const quantity = Number(item.quantity) || 1;
      
      const existing = prev.find((i) => i.lineId === signature)
      if (existing) {
        return prev.map((i) =>
          i.lineId === signature ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, unitPrice, quantity, lineId: signature }]
    })
  }

  function increment(lineId: string) {
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i)))
  }

  function decrement(lineId: string) {
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity - 1 } : i)).filter((i) => i.quantity > 0)
    )
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId))
  }

  function clearCart() {
    setItems([])
  }

  function reorder(order: PastOrder) {
    // Lógica simplificada de reorder (asume que los productos existen en el menú)
    setScreen("cart")
  }

  function placeOrder(details: OrderDetails) {
    const total = subtotal + details.deliveryFee
    setLoyaltyPoints((p) => p + Math.round(total / 100))
    setLastEta(20 + Math.floor(Math.random() * 16))
    
    const newOrder: PastOrder = {
      id: `QMH-${1043 + history.length}`,
      date: "Hoy",
      items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
      productIds: items.flatMap((i) => Array.from({ length: i.quantity }, () => i.productId)),
      total,
    }
    
    setHistory((prev) => [newOrder, ...prev])
    setOrderDetails(details)
    setItems([])
    setScreen("success")
  }

  const itemCount = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items])

  const subtotal = useMemo(() => {
    return items.reduce((acc, i) => {
      const price = Number(i.unitPrice) || 0;
      const qty = Number(i.quantity) || 0;
      return acc + (price * qty);
    }, 0);
  }, [items])

  const value: StoreContextValue = {
    screen, setScreen, items, addItem, increment, decrement, removeItem, clearCart,
    itemCount, subtotal, loyaltyPoints, history, reorder, placeOrder, lastEta,
    orderDetails, setOrderDetails,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}