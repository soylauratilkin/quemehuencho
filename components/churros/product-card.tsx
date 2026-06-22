"use client"

import { formatPrice, type Product } from "@/lib/menu-data"
import { Plus, Minus } from "lucide-react"

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  quantity?: number
}

export function ProductCard({ 
  product, 
  onAdd, 
  onIncrement, 
  onDecrement, 
  quantity = 0,
}: ProductCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#111] ring-1 ring-[#333] transition-all hover:ring-[#ff751f]/50">
      {product.image && (
        <div className="relative h-48 overflow-hidden bg-[#0a0a0a]">
          <img 
            src={product.image} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-base font-bold text-white line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{product.description}</p>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-extrabold text-[#ff751f]">{formatPrice(product.price)}</span>
          
          {quantity === 0 ? (
            <button
              onClick={() => onAdd(product)}
              className="flex size-10 items-center justify-center rounded-full bg-[#ff751f] text-black transition-transform active:scale-95"
            >
              <Plus className="size-5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-[#ff751f] p-1">
              <button 
                onClick={() => onDecrement(product.id)} 
                className="flex size-8 items-center justify-center rounded-full bg-black text-white"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-7 text-center text-sm font-black text-black">{quantity}</span>
              <button 
                onClick={() => onIncrement(product.id)} 
                className="flex size-8 items-center justify-center rounded-full bg-black text-white"
              >
                <Plus className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}