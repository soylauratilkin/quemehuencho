export type CategoryId = "combos" | "docenas" | "unidad";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  popular?: boolean;
  image?: string; // Opcional: podés agregar URLs de imágenes en tu Google Sheet
};

// Solo mostramos estas categorías en la app de delivery
export const categories: { id: CategoryId; label: string }[] = [
  { id: "combos", label: "Combos" },
  { id: "docenas", label: "Docenas" },
  { id: "unidad", label: "x Unidad" },
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
};

// ⚠️ REEMPLAZA ESTO con la URL de tu Google Sheet publicado como CSV
export const MENU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIZsfI1fWq7zCV3Vc_u2v5A-Tgk_XxYo5P0EqjzLfC1QTcORVdkvanwuYiXxM2dQuUjB4uv_qM4GfW/pubhtml?gid=0&single=true"; 
export const PRICES_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIZsfI1fWq7zCV3Vc_u2v5A-Tgk_XxYo5P0EqjzLfC1QTcORVdkvanwuYiXxM2dQuUjB4uv_qM4GfW/pubhtml?gid=1196570129&single=true"; // URL de la hoja de precios de envío (opcional, usamos la tabla de abajo por defecto)

// Tabla de precios de envío por KM (basada en tus datos)
export const PRECIOS_ENVIO = [
  { km_min: 0, km_max: 1.6, precio: 4000 },
  { km_min: 1.7, km_max: 1.9, precio: 4200 },
  { km_min: 2, km_max: 2.4, precio: 4400 }, // Promedio de 4300-4500
  { km_min: 2.5, km_max: 2.9, precio: 4600 }, // Promedio de 4500-4700
  { km_min: 3, km_max: 3.5, precio: 4850 }, // Promedio de 4700-5000
  { km_min: 3.6, km_max: 4, precio: 5100 }, // Promedio de 5000-5200
  { km_min: 4.1, km_max: 4.4, precio: 5350 }, // Promedio de 5200-5500
  { km_min: 4.5, km_max: 4.9, precio: 5600 }, // Promedio de 5500-5700
  { km_min: 5, km_max: 5.5, precio: 5800 }, // Promedio de 5700-5900
  { km_min: 5.6, km_max: 6, precio: 6050 }, // Promedio de 5900-6200
  { km_min: 6.1, km_max: 10, precio: 6300 },
];

export function calcularPrecioEnvio(distanciaKm: number): number | null {
  const rango = PRECIOS_ENVIO.find(
    (r) => distanciaKm >= r.km_min && distanciaKm <= r.km_max
  );
  return rango ? rango.precio : null;
}

// Datos de respaldo por si el Google Sheet falla o está vacío
export const fallbackProducts: Product[] = [
  { id: "combo-libre", name: "churroLIBRE!", description: "1 chocolate grande + todos los churros que quieras!", price: 12500, category: "combos", popular: true },
  { id: "promo-todo-choco", name: "promoTODOchoco!", description: "1 chocolate mediano + 1 choco + 1 coco + 1 mani", price: 8500, category: "combos" },
  { id: "mezcladito-tranka", name: "mezcladitoTRANKA!", description: "6 dulce de leche + 2 choco + 2 coco + 2 mani", price: 13600, category: "combos" },
  { id: "doc-ddl", name: "Docena DDL", description: "Docena de dulce de leche", price: 12000, category: "docenas", popular: true },
  { id: "doc-choc", name: "Docena Bañados", description: "Docena de dulce de leche bañado en chocolate", price: 14400, category: "docenas" },
  { id: "uni-ddl-azu", name: "DDL con Azúcar", description: "Churro de dulce de leche con azúcar", price: 1000, category: "unidad" },
  { id: "uni-ddl-choc", name: "DDL Bañado", description: "Churro de dulce de leche bañado en chocolate", price: 1200, category: "unidad", popular: true },
  { id: "uni-fr-choc", name: "Frutos Rojos Bañado", description: "Churro de frutos rojos bañado en chocolate", price: 1300, category: "unidad" },
];

export async function fetchProductsFromGoogleSheet(csvUrl: string): Promise<Product[]> {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    
    const products: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Nota: Este parser simple asume que no hay comas dentro de las descripciones. 
      // Si las hay, se recomienda usar una librería como 'papaparse'.
      const values = lines[i].split(",");
      if (values.length >= 4) {
        const categoriaRaw = values[0]?.trim().toLowerCase() || "";
        let category: CategoryId = "unidad";
        if (categoriaRaw.includes("combo") || categoriaRaw.includes("promo") || categoriaRaw.includes("mezcla")) category = "combos";
        else if (categoriaRaw.includes("doc")) category = "docenas";

        products.push({
          id: `prod-${i}`,
          name: values[1]?.trim() || "Producto",
          description: values[2]?.trim() || "",
          price: parseInt(values[3]?.trim() || "0", 10),
          category,
        });
      }
    }
    // Filtrar solo las categorías permitidas para delivery
    return products.filter((p) => ["combos", "docenas", "unidad"].includes(p.category));
  } catch (error) {
    console.error("Error fetching menu:", error);
    return fallbackProducts;
  }
}