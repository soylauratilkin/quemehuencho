export type CategoryId = "combos" | "docenas" | "unidad";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  popular?: boolean;
  image?: string;
};

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
    maximumFractionDigits: 0,
  }).format(price).replace(/\s/g, "") // Elimina espacios
}

// URLs de tus Google Sheets publicadas como CSV
export const MENU_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIZsfI1fWq7zCV3Vc_u2v5A-Tgk_XxYo5P0EqjzLfC1QTcORVdkvanwuYiXxM2dQuUjB4uv_qM4GfW/pub?gid=0&single=true&output=csv";
export const CONFIG_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSIZsfI1fWq7zCV3Vc_u2v5A-Tgk_XxYo5P0EqjzLfC1QTcORVdkvanwuYiXxM2dQuUjB4uv_qM4GfW/pub?gid=1021721216&single=true&output=csv"; // Pegá la URL de la hoja Config

// Configuración por defecto (fallback)
export const DEFAULT_CONFIG = {
  telefono_delivery: "5492804602800",
  telefono_quemehuencho: "5492804007296",
  envio_minimo: 4000,
  horario_apertura_mañana: "09:30",
  horario_cierre_mañana: "12:00",
  horario_apertura_tarde: "16:30",
  horario_cierre_tarde: "20:30",
  esta_online: true,
  direccion_local: "Roque Sáenz Peña 212, Puerto Madryn",
  alias_mercadopago: "quemehuencho.mp",
  nombre_titular_alias: "María Laura Tilkin",
};

export const PRECIOS_ENVIO = [
  { km_min: 0, km_max: 1.6, precio: 4000 },
  { km_min: 1.7, km_max: 1.9, precio: 4200 },
  { km_min: 2, km_max: 2.4, precio: 4400 },
  { km_min: 2.5, km_max: 2.9, precio: 4600 },
  { km_min: 3, km_max: 3.5, precio: 4850 },
  { km_min: 3.6, km_max: 4, precio: 5100 },
  { km_min: 4.1, km_max: 4.4, precio: 5350 },
  { km_min: 4.5, km_max: 4.9, precio: 5600 },
  { km_min: 5, km_max: 5.5, precio: 5800 },
  { km_min: 5.6, km_max: 6, precio: 6050 },
  { km_min: 6.1, km_max: 10, precio: 6300 },
];

export function calcularPrecioEnvio(distanciaKm: number): number | null {
  const rango = PRECIOS_ENVIO.find(
    (r) => distanciaKm >= r.km_min && distanciaKm <= r.km_max
  );
  return rango ? rango.precio : null;
}

export const products: Product[] = [
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
    
    const productsList: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length >= 4) {
        const categoriaRaw = values[0]?.trim().toLowerCase() || "";
        let category: CategoryId = "unidad";
        if (categoriaRaw.includes("combo") || categoriaRaw.includes("promo") || categoriaRaw.includes("mezcla")) category = "combos";
        else if (categoriaRaw.includes("doc")) category = "docenas";

        // LEER LA IMAGEN (Columna 5, índice 4)
        const imageRaw = values[4]?.trim() || "";
        // Si es una URL completa (http) la usamos, si no, asumimos que es local (/images/...)
        const image = imageRaw.startsWith("http") ? imageRaw : (imageRaw || undefined);

        productsList.push({
          id: `prod-${i}`,
          name: values[1]?.trim() || "Producto",
          description: values[2]?.trim() || "",
          price: parseInt(values[3]?.trim() || "0", 10),
          category,
          image: image, // <--- AGREGADO
        });
      }
    }
    return productsList.filter((p) => ["combos", "docenas", "unidad"].includes(p.category));
  } catch (error) {
    console.error("Error fetching menu:", error);
    return products;
  }
}

export async function fetchConfig(): Promise<typeof DEFAULT_CONFIG> {
  if (!CONFIG_CSV_URL) return DEFAULT_CONFIG;
  
  try {
    const response = await fetch(CONFIG_CSV_URL);
    const text = await response.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    
    const config = { ...DEFAULT_CONFIG };
    for (let i = 1; i < lines.length; i++) {
      const [clave, valor] = lines[i].split(",").map(s => s.trim());
      if (clave && valor) {
        if (clave in config) {
          if (clave === "esta_online") {
            (config as any)[clave] = valor.toLowerCase() === "true";
          } else if (clave === "envio_minimo") {
            (config as any)[clave] = parseInt(valor, 10);
          } else {
            (config as any)[clave] = valor;
          }
        }
      }
    }
    return config;
  } catch (error) {
    console.error("Error fetching config:", error);
    return DEFAULT_CONFIG;
  }
}