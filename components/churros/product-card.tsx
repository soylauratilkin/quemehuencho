"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Product, formatPrice } from "@/lib/menu-data"
import { useStore } from "./store"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useStore()
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="group relative h-64 w-full overflow-hidden rounded-3xl bg-card">
      {/* Imagen de fondo */}
      {product.image && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}

      {/* Contenido */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-heading text-lg font-bold leading-tight text-white drop-shadow-lg">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 text-xs text-gray-200 drop-shadow-md">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer con precio y botón */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-300">Precio</span>
            <span className="font-heading text-xl font-bold text-[#ff751f] drop-shadow-lg">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button
            onClick={() => addItem(product)}
            className="flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-lg transition-transform active:scale-95 hover:bg-[#ff751f]/90"
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="size-6 font-bold" />
          </button>
        </div>
      </div>

      {/* Badge de popular */}
      {product.popular && (
        <div className="absolute right-3 top-3 rounded-full bg-[#ff751f] px-3 py-1 text-xs font-bold text-black">
          ⭐ Popular
        </div>
      )}
    </div>
  )
}