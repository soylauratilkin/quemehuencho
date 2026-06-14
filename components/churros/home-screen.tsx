"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Clock, Loader2, MapPin, RotateCcw, Sparkles } from "lucide-react"
import {
  categories,
  fetchProductsFromGoogleSheet,
  formatPrice,
  MENU_CSV_URL,
  products as fallbackProducts,
  type CategoryId,
} from "@/lib/menu-data"
import { categoryIcon } from "./category-icons"
import { useStore } from "./store"
import { ProductCard } from "./product-card"

export function HomeScreen() {
  const { loyaltyPoints, history, reorder } = useStore()
  const [activeCat, setActiveCat] = useState<CategoryId>("combos")

  // Loads the menu from the published Google Sheet CSV when MENU_CSV_URL is set,
  // otherwise falls back to the hardcoded list. SWR keeps the fallback shown
  // instantly while any fetch resolves in the background.
  const { data: products, isLoading } = useSWR(
    MENU_CSV_URL ? ["menu", MENU_CSV_URL] : null,
    () => fetchProductsFromGoogleSheet(MENU_CSV_URL),
    { fallbackData: fallbackProducts, revalidateOnFocus: false },
  )

  const menu = products ?? fallbackProducts
  const lastOrder = history[0]

  const visible = useMemo(
    () => menu.filter((p) => p.category === activeCat),
    [menu, activeCat],
  )

  return (
    <div className="pb-40">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          Puerto Madryn · Centro
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1.5 text-sm font-bold text-primary">
          <Sparkles className="size-4 text-gold" />
          {loyaltyPoints} pts
        </div>
      </header>

      <div className="px-5 pt-3">
        <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground">
          Quemehuencho
        </h1>
        <p className="text-sm text-muted-foreground">
          Churros artesanales recién hechos
        </p>
      </div>

      {/* Hero */}
      <section className="px-5 pt-4">
        <div className="relative h-44 w-full overflow-hidden rounded-4xl shadow-md">
          <Image
            src="/images/hero-churros.png"
            alt="Churros con dulce de leche recién hechos"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 28rem"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 text-primary-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-add px-3 py-1 text-xs font-bold text-add-foreground">
              <Clock className="size-3" />
              Listo en 25 min
            </span>
            <h2 className="mt-2 text-pretty font-heading text-2xl font-semibold leading-tight">
              churroLIBRE!
            </h2>
            <p className="text-sm font-medium opacity-90">
              Todos los churros que quieras + chocolate.
            </p>
          </div>
        </div>
      </section>

      {/* Reorder */}
      {lastOrder && (
        <section className="px-5 pt-5">
          <button
            onClick={() => reorder(lastOrder)}
            className="flex w-full items-center justify-between rounded-3xl border border-dashed border-primary/40 bg-card px-4 py-3 text-left transition-colors active:bg-secondary"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RotateCcw className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">
                  Volver a pedir
                </span>
                <span className="block text-xs text-muted-foreground">
                  {lastOrder.items
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(", ")}
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-add px-3 py-2 text-sm font-bold text-add-foreground">
              {formatPrice(lastOrder.total)}
            </span>
          </button>
        </section>
      )}

      {/* Sticky category tabs */}
      <div className="sticky top-0 z-10 mt-6 border-b border-border bg-background/95 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
          {categories.map((cat) => {
            const Icon = categoryIcon[cat.id]
            const isActive = cat.id === activeCat
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                aria-pressed={isActive}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="size-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Product list */}
      <section className="px-5 pt-5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando menú…
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
