import React, { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { User } from "../../tipos";

export default function usePerfilEffects(activeUser: User, selectedCreatorId?: string | null) {
  // Configuración de la barra de estado nativa en celulares para la página de perfil:
  // Fondo blanco sólido (#ffffff, sin transparencia) y texto/iconos oscuros legibles
  useEffect(() => {
    const applyProfileStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && Capacitor.isPluginAvailable("StatusBar")) {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (e) {
        console.warn("StatusBar setup in Perfil:", e);
      }

      // Sincronizar theme-color en el DOM para la barra de estado nativa
      const themeMeta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", "#ffffff");
      }
      document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
        tag.setAttribute("content", "#ffffff");
      });

      // Configurar apple-mobile-web-app-status-bar-style a default para eliminar translucidez
      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusMeta) {
        appleStatusMeta.setAttribute("content", "default");
      }

      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
    };

    applyProfileStatusBar();
  }, []);

  // Asegurar que al navegar a la página de perfil siempre abra en la parte superior de la pantalla
  useEffect(() => {
    const scrollToTop = () => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const scrollableSelectors = [
          "#android-app-layout",
          "#android-profile-view",
          "#android-profile-container",
          "#app-android-container",
          "main"
        ];
        scrollableSelectors.forEach((selector) => {
          const el = document.querySelector(selector);
          if (el) {
            el.scrollTop = 0;
          }
        });
      }
    };

    // Scroll inmediato
    scrollToTop();

    // Re-verificar tras el pintado del navegador (RAF y timeout corto) para neutralizar cualquier scroll previo
    const rafId = requestAnimationFrame(scrollToTop);
    const timeoutId = setTimeout(scrollToTop, 40);

    const handleRouteChange = () => {
      scrollToTop();
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("app-route-change", handleRouteChange);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("app-route-change", handleRouteChange);
    };
  }, [activeUser.id, activeUser.username, selectedCreatorId]);


}
