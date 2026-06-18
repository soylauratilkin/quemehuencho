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
  const [imageError, setImageError] = useState(false)

  return (
    <div className="group relative h-64 w-full overflow-hidden rounded-3xl bg-[#1a1a1a] shadow-lg">
      {/* Imagen de fondo */}
      {product.image && !imageError ? (
        <>
          {/* Gradiente overlay - SIEMPRE detrás del contenido */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
          
          {/* Imagen */}
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </>
      ) : (
        /* Fondo de respaldo naranja */
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff751f] to-[#cc5500]" />
      )}

      {/* CONTENIDO - SIEMPRE ENCIMA (z-20) */}
      <div className="relative z-20 flex h-full flex-col justify-between p-5">
        {/* Nombre del producto */}
        <div>
          <h3 className="font-heading text-xl font-extrabold text-white drop-shadow-lg uppercase tracking-wide">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-2 text-base md:text-lg font-extrabold text-white drop-shadow-md">
              {product.description}
            </p>
          )}
        </div>

        {/* Precio y botón */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">Precio</span>
            <div className="font-heading text-2xl font-extrabold text-[#ff751f] drop-shadow-lg">
              {formatPrice(product.price)}
            </div>
          </div>
          
          <button
            onClick={() => addItem(product)}
            className="flex size-12 items-center justify-center rounded-full bg-[#ff751f] text-black shadow-xl transition-all active:scale-90 hover:bg-white hover:shadow-2xl"
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="size-7 font-black" strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Badge Popular */}
      {product.popular && (
        <div className="absolute right-3 top-3 z-30 rounded-full bg-[#ff751f] px-3 py-1 text-xs font-black text-black shadow-lg uppercase">
          Popular
        </div>
      )}
    </div>
  )
}