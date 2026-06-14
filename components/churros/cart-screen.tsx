"use client"

import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { formatPrice } from "@/lib/menu-data"
import { categoryIcon } from "./category-icons"
import { useStore } from "./store"

const DELIVERY_FEE = 1500

export function CartScreen() {
  const { items, increment, decrement, removeItem, subtotal, setScreen } =
    useStore()

  const total = items.length > 0 ? subtotal + DELIVERY_FEE : 0

  return (
    <div className="flex min-h-dvh flex-col pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <button
          onClick={() => setScreen("home")}
          aria-label="Volver"
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Tu pedido
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
            <ShoppingBag className="size-9" />
          </div>
          <p className="text-pretty text-lg font-bold text-foreground">
            Tu carrito está vacío
          </p>
          <p className="text-sm text-muted-foreground">
            Agregá unos churros calentitos para empezar.
          </p>
          <button
            onClick={() => setScreen("home")}
            className="mt-2 h-12 rounded-full bg-primary px-6 font-bold text-primary-foreground"
          >
            Ver el menú
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 px-4 pt-4">
            <ul className="space-y-3">
              {items.map((item) => {
                const Icon = categoryIcon[item.category]
                return (
                  <li
                    key={item.lineId}
                    className="flex gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border"
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Icon className="size-7" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-pretty font-bold leading-snug text-foreground">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.lineId)}
                          aria-label={`Quitar ${item.name}`}
                          className="text-muted-foreground transition-colors active:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPrice)} c/u
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-full bg-secondary p-1">
                          <button
                            onClick={() => decrement(item.lineId)}
                            aria-label="Quitar uno"
                            className="flex size-8 items-center justify-center rounded-full bg-card text-foreground shadow-sm"
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="w-5 text-center font-bold tabular-nums text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increment(item.lineId)}
                            aria-label="Agregar uno"
                            className="flex size-8 items-center justify-center rounded-full bg-add text-add-foreground shadow-sm"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <span className="font-extrabold tabular-nums text-foreground">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 space-y-2 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Envío" value={formatPrice(DELIVERY_FEE)} />
              <div className="my-1 border-t border-dashed border-border" />
              <Row label="Total" value={formatPrice(total)} strong />
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-card px-4 py-4">
            <button
              onClick={() => setScreen("checkout")}
              className="flex h-14 w-full items-center justify-between rounded-full bg-primary px-6 font-bold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <span>Continuar</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          strong
            ? "text-base font-bold text-foreground"
            : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "text-lg font-extrabold tabular-nums text-foreground"
            : "text-sm font-semibold tabular-nums text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}
