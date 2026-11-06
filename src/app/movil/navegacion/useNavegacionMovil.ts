import { useCallback, useState } from "react";
import type { NavigationTab } from "../tipos";
import { navigateTo, parseRoute } from "../enrutador";

function obtenerPestanaInicial(): NavigationTab {
  if (typeof window === "undefined") return "inicio";
  const ruta = parseRoute(window.location.pathname);
  if (ruta.type === "store" || ruta.type === "profile" || ruta.type === "login") return "profile";
  if (ruta.type === "messages") return "messages";
  if (ruta.type === "product" || ruta.type === "shop" || ruta.type === "cart" || ruta.type === "checkout") return "shop";
  return "inicio";
}

export function useNavegacionMovil() {
  const [pestanaActiva, establecerPestanaActiva] = useState<NavigationTab>(obtenerPestanaInicial);

  const navegarA = useCallback((
    pestana: NavigationTab,
    ruta: string,
    antesDeNavegar?: () => void
  ) => {
    antesDeNavegar?.();
    establecerPestanaActiva(pestana);
    navigateTo(ruta);
  }, []);

  return { pestanaActiva, establecerPestanaActiva, navegarA };
}
