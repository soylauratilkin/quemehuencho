"use client"

import { ShoppingBag } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"
import { useStore } from "./store"

export function FloatingCart() {
  const { itemCount, subtotal, setScreen, screen } = useStore()

  if (itemCount === 0 || screen !== "home") return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4 pb-5">
      <button
        onClick={() => setScreen("cart")}
        className="pointer-events-auto flex h-16 w-full items-center justify-between rounded-full bg-add px-3 pl-5 text-add-foreground shadow-xl transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center rounded-full bg-add-foreground/15">
            <ShoppingBag className="size-5" />
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
              {itemCount}
            </span>
          </span>
          <span className="font-bold">Ver pedido</span>
        </span>
        <span className="rounded-full bg-add-foreground/15 px-4 py-2 font-extrabold tabular-nums">
          {formatPrice(subtotal)}
        </span>
      </button>
    </div>
  )
}
