"use client"

import { useState } from "react"
import { Check, Plus, Star } from "lucide-react"
import { formatPrice, type Product } from "@/lib/menu-data"
import { categoryIcon } from "./category-icons"
import { useStore } from "./store"

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useStore()
  const [added, setAdded] = useState(false)
  const Icon = categoryIcon[product.category]

  function add() {
    addItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      unitPrice: product.price,
      quantity: 1,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 900)
  }

  return (
    <article className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-sm ring-1 ring-border">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate font-heading text-base font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
          {product.popular && (
            <Star
              className="size-3.5 shrink-0 fill-gold text-gold"
              aria-label="Popular"
            />
          )}
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-base font-extrabold tabular-nums text-primary">
          {formatPrice(product.price)}
        </span>
        <button
          onClick={add}
          aria-label={`Agregar ${product.name}`}
          className="flex size-10 items-center justify-center rounded-full bg-add text-add-foreground shadow-md transition-transform active:scale-90"
        >
          {added ? (
            <Check className="size-5" strokeWidth={3} />
          ) : (
            <Plus className="size-5" strokeWidth={3} />
          )}
        </button>
      </div>
    </article>
  )
}
