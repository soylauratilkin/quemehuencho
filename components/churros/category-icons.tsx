import {
  Coffee,
  CupSoda,
  Croissant,
  Gift,
  Leaf,
  Package,
  type LucideIcon,
} from "lucide-react"
import type { CategoryId } from "@/lib/menu-data"

export const categoryIcon: Record<CategoryId, LucideIcon> = {
  combos: Gift,
  docenas: Package,
  unidad: Croissant,
  mates: Leaf,
  cafeteria: Coffee,
  bebidas: CupSoda,
}
