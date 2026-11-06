import { User, Reel, Product, Order } from "../../../types";
export function calcularReelsDestacados(reels: Reel[]) {

    return [...reels]
      .sort((a, b) => {
        const scoreB = (Number(b.views) || 0) + (Number(b.likes) || 0) * 3;
        const scoreA = (Number(a.views) || 0) + (Number(a.likes) || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 6);
}

export function calcularProductosDestacados(products: Product[], orders: Order[]) {

    const salesByProduct: Record<string, { units: number; revenue: number }> = {};
    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item) => {
        const pid = item.productId || item.name;
        if (!pid) return;
        if (!salesByProduct[pid]) {
          salesByProduct[pid] = { units: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 1;
        salesByProduct[pid].units += qty;
        salesByProduct[pid].revenue += (Number(item.price) || 0) * qty;
      });
    });

    return products
      .map((prod) => {
        const stats = salesByProduct[prod.id] || salesByProduct[prod.name] || {
          units: 0,
          revenue: 0,
        };
        return {
          product: prod,
          unitsSold: stats.units,
          revenue: stats.revenue,
          views: Number(prod.views) || 0,
        };
      })
      .sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
        return b.views - a.views;
      })
      .slice(0, 6);
}

export function calcularCreadoresDestacados(users: User[], reels: Reel[], products: Product[]) {

    return users
      .map((u) => {
        const userReels = reels.filter(
          (r) =>
            r.creatorId === u.id ||
            (r.creatorUsername &&
              u.username &&
              r.creatorUsername.toLowerCase() === u.username.toLowerCase())
        );
        const userProducts = products.filter(
          (p) =>
            p.sellerId === u.id ||
            (p.sellerUsername &&
              u.username &&
              p.sellerUsername.toLowerCase() === u.username.toLowerCase())
        );
        const creatorViews = userReels.reduce(
          (acc, r) => acc + (Number(r.views) || 0),
          0
        );
        const creatorLikes = userReels.reduce(
          (acc, r) => acc + (Number(r.likes) || 0),
          0
        );
        return {
          user: u,
          reelsCount: userReels.length,
          productsCount: userProducts.length,
          totalViews: creatorViews,
          totalLikes: creatorLikes,
        };
      })
      .sort((a, b) => {
        const scoreB = b.totalViews + b.reelsCount * 10 + b.productsCount * 5;
        const scoreA = a.totalViews + a.reelsCount * 10 + a.productsCount * 5;
        return scoreB - scoreA;
      })
      .slice(0, 6);
}
