"use client"

import { cn } from "@/lib/utils"

export type CategoryId = "unidad" | "combos" | "docenas"

const categories = [
  { id: "combos" as CategoryId, label: "Combos", emoji: "" },
  { id: "docenas" as CategoryId, label: "Por docena", emoji: "" },
  { id: "unidad" as CategoryId, label: "Uno por uno", emoji: "" },
]

interface CategorySelectorProps {
  selectedCategory: CategoryId
  onCategoryChange: (category: CategoryId) => void
}

export function CategorySelector({ selectedCategory, onCategoryChange }: CategorySelectorProps) {
  return (
    <div className="flex gap-2 pb-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={cn(
            "flex-1 rounded-full px-3 py-2.5 text-sm font-bold transition-all text-center",
            selectedCategory === cat.id
              ? "bg-[#ff751f] text-black shadow-lg"
              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
          )}
        >
          {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
          {cat.label}
        </button>
      ))}
    </div>
  )
}