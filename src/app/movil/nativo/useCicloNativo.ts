import { useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

export function useCicloNativo() {
  useEffect(() => {
    try {
      if (Capacitor.isNativePlatform()) {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      }
    } catch {}
  }, []);

  const ocultarPantallaCarga = useCallback(() => {
    try {
      if (Capacitor.isNativePlatform()) SplashScreen.hide().catch(() => {});
    } catch {}
  }, []);

  return { ocultarPantallaCarga };
}
