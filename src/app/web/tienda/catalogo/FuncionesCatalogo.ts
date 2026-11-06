import { Product, User } from "../../../../types";
import { CATEGORIES } from "./ConstantesCatalogo";

export function filtrarProductosCatalogo(
  products: Product[],
  selectedCategory: string,
  searchQuery: string
): Product[] {
  return products.filter((product) => {
    if (selectedCategory && selectedCategory !== "todos") {
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat) {
        if (product.category) {
          if (product.category.toLowerCase() !== cat.name.toLowerCase()) {
            return false;
          }
        } else {
          const term = cat.queryTerm.toLowerCase();
          if (term) {
            const matchesCategory =
              product.name.toLowerCase().includes(term) ||
              product.description.toLowerCase().includes(term);
            if (!matchesCategory) return false;
          } else {
            return false;
          }
        }
      }
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q)
    );
  });
}

export function obtenerVendedor(sellerId: string, users: User[]): { name: string; avatar: string } {
  const user = users.find((u) => u.id === sellerId);
  return user ? { name: user.name, avatar: user.avatar } : { name: "Vendedor Destacado", avatar: "" };
}
