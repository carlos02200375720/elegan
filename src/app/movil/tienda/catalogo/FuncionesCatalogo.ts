import { Product, CartItem } from "../../tipos";
import { AndroidCategory } from "./TiposCatalogo";
import { getProductImageUrl } from "../productMedia";

export const CATEGORIES_WITH_IMAGES: AndroidCategory[] = [
  {
    id: "todos",
    name: "Todos",
    queryTerm: "",
    imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "ropa_femenina",
    name: "Ropa Femenina",
    queryTerm: "femenina",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "ropa_masculina",
    name: "Ropa Masculina",
    queryTerm: "masculina",
    imageUrl: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "mascota",
    name: "Mascotas",
    queryTerm: "mascota",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "hogar",
    name: "Hogar",
    queryTerm: "neon",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "salud",
    name: "Salud",
    queryTerm: "yoga",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "joya",
    name: "Joyas",
    queryTerm: "joya",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "bolso",
    name: "Bolsos",
    queryTerm: "bolso",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "sapato",
    name: "Zapatos",
    queryTerm: "zapato",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "juguete",
    name: "Juguetes",
    queryTerm: "juguete",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "deportes",
    name: "Deportes",
    queryTerm: "yoga",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "electronica",
    name: "Electrónica",
    queryTerm: "synth",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "automotriz",
    name: "Automotriz",
    queryTerm: "automotriz",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "telefono",
    name: "Teléfonos",
    queryTerm: "telefono",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "informatica",
    name: "Informática",
    queryTerm: "informatica",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=150&q=80",
  },
];

/**
 * Builds the complete category list merging default categories with any dynamic categories from products
 */
export function buildCategoriesList(products: Product[]): AndroidCategory[] {
  const list: AndroidCategory[] = [...CATEGORIES_WITH_IMAGES];

  (products || []).forEach((p) => {
    if (p.category && p.category.trim()) {
      const catName = p.category.trim();
      const exists = list.some(
        (c) =>
          c.name.toLowerCase() === catName.toLowerCase() ||
          c.id.toLowerCase() === catName.toLowerCase()
      );
      if (!exists) {
        list.push({
          id: catName.toLowerCase().replace(/\s+/g, "_"),
          name: catName,
          queryTerm: catName.toLowerCase(),
          imageUrl:
            getProductImageUrl(p) ||
            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80",
        });
      }
    }
  });

  return list;
}

/**
 * Filters products based on selected category and search query
 */
export function filterProducts(
  products: Product[],
  activeCategory: string,
  searchQuery: string,
  categoriesList: AndroidCategory[]
): Product[] {
  return (products || []).filter((p) => {
    let matchCat = activeCategory === "Todos" || activeCategory === "todos";
    if (!matchCat) {
      const activeCatObj = categoriesList.find(
        (c) =>
          c.name.toLowerCase() === activeCategory.toLowerCase() ||
          c.id.toLowerCase() === activeCategory.toLowerCase()
      );
      if (p.category) {
        matchCat =
          p.category.toLowerCase().trim() ===
          (activeCatObj ? activeCatObj.name.toLowerCase() : activeCategory.toLowerCase().trim());
      } else if (activeCatObj?.queryTerm) {
        const term = activeCatObj.queryTerm.toLowerCase();
        matchCat =
          p.name.toLowerCase().includes(term) ||
          Boolean(p.description && p.description.toLowerCase().includes(term));
      }
    }

    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });
}

/**
 * Calculates cart subtotal based on effective checkout items
 */
export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * (item.quantity || 1), 0);
}

/**
 * Calculates cart shipping total based on effective checkout items
 */
export function calculateCartShippingTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const fee =
      item.selectedShippingCost !== undefined
        ? Number(item.selectedShippingCost)
        : item.product.shippingCost !== undefined
        ? Number(item.product.shippingCost)
        : 0;
    return sum + (Number.isNaN(fee) ? 0 : fee) * (item.quantity || 1);
  }, 0);
}
