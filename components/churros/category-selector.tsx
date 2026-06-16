"use client"

import { cn } from "@/lib/utils"

export type CategoryId = "unidad" | "combos" | "docenas" | "all"

const categories = [
  { id: "combos" as CategoryId, label: "Combos" },
  { id: "docenas" as CategoryId, label: "Docenas" },
  { id: "unidad" as CategoryId, label: "Unidad" },
  { id: "all" as CategoryId, label: "Todos" },
]

interface CategorySelectorProps {
  selectedCategory: CategoryId | "all"
  onCategoryChange: (category: CategoryId | "all") => void
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "shrink-0 rounded-full px-5 py-2 text-sm font-bold transition-all",
            selectedCategory === cat.id
              ? "bg-[#ff751f] text-black"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}