import { AdminTab } from "./tipos";
const VALID_ADMIN_TABS: AdminTab[] = ["resumen","usuarios","reels","productos","publicar","ordenes","metrica","fotos_defecto","sistema"];
export function parseAdminTabFromPath(pathname: string): AdminTab {
 let decoded = pathname;
 try { decoded = decodeURIComponent(pathname); } catch {}
 const match = decoded.trim().replace(/\/+$/, "").match(/^\/(?:src\/app\/|app\/(?:web\/)?)?admin\/([^/]+)/i);
 if (match) {
  const raw = match[1].toLowerCase();
  if (raw === "producto" || raw === "productos") return "productos";
  if (raw === "pedido" || raw === "pedidos" || raw === "ordenes") return "ordenes";
  if (["metrica","metricas","métrica","métricas","embudo"].includes(raw)) return "metrica";
  if (VALID_ADMIN_TABS.includes(raw as AdminTab)) return raw as AdminTab;
 }
 return "resumen";
}
