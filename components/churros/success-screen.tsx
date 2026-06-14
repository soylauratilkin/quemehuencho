"use client"

import { useEffect, useState } from "react"
import { Check, ChefHat, Clock, Bike, PartyPopper, Sparkles } from "lucide-react"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

const steps = [
  { id: 0, label: "Pedido confirmado", icon: Check },
  { id: 1, label: "Preparando tus churros", icon: ChefHat },
  { id: 2, label: "En camino", icon: Bike },
  { id: 3, label: "Entregado", icon: PartyPopper },
]

export function SuccessScreen() {
  const { setScreen, lastEta, loyaltyPoints, history } = useStore()
  const [current, setCurrent] = useState(0)
  const order = history[0]

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrent(1), 1500),
      setTimeout(() => setCurrent(2), 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-10">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-add text-add-foreground shadow-lg">
          <Check className="size-10" strokeWidth={3} />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-semibold text-foreground">
          ¡Pedido confirmado!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order ? `Pedido ${order.id}` : "Gracias por tu compra"}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground">
          <Clock className="size-5" />
          <span className="font-bold">Llega en ~{lastEta} min</span>
        </div>
      </div>

      {/* Tracking */}
      <div className="mt-9 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
        <ol className="space-y-1">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const done = idx <= current
            const isLast = idx === steps.length - 1
            return (
              <li key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full transition-colors",
                      done
                        ? "bg-add text-add-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  {!isLast && (
                    <span
                      className={cn(
                        "my-1 w-0.5 flex-1 rounded-full transition-colors",
                        idx < current ? "bg-add" : "bg-border",
                      )}
                      style={{ minHeight: "1.5rem" }}
                    />
                  )}
                </div>
                <div className="pb-4 pt-1.5">
                  <p
                    className={cn(
                      "font-bold",
                      done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {idx === current && idx < steps.length - 1 && (
                    <p className="text-xs font-semibold text-add">En curso…</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Loyalty */}
      <div className="mt-5 flex items-center gap-3 rounded-3xl bg-gold/20 p-4">
        <span className="flex size-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="font-bold text-foreground">Sumaste puntos</p>
          <p className="text-sm text-muted-foreground">
            Tenés {loyaltyPoints} puntos de fidelidad acumulados.
          </p>
        </div>
      </div>

      <button
        onClick={() => setScreen("home")}
        className="mt-auto h-14 w-full rounded-full bg-primary font-bold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        Volver al inicio
      </button>
    </div>
  )
}
