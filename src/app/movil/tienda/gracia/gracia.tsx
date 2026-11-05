import React, { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { AndroidGraciaProps } from "./TiposConfirmacion";
import {
  calculateOrderSubtotal,
  getEffectiveShipping,
  calculateThankYouTotal,
} from "./FuncionesConfirmacion";
import { EncabezadoConfirmacion } from "./EncabezadoConfirmacion";
import { ResumenCompra } from "./ResumenCompra";
import { AccionesConfirmacion } from "./AccionesConfirmacion";

export function GraciaTiendaView({
  lastOrderItems,
  lastDeliveryAddress,
  lastContactInfo,
  onContinueShopping,
  onNavigateToHistory,
  lastShippingCost,
  lastShippingCarrier,
  orderTotal,
}: AndroidGraciaProps) {
  const subtotal = calculateOrderSubtotal(lastOrderItems);
  const effectiveShipping = getEffectiveShipping(lastOrderItems, lastShippingCost);
  const thankYouTotal = calculateThankYouTotal(lastOrderItems, lastShippingCost, orderTotal);

  // Configuración de la barra de estado nativa en blanco sólido (#ffffff) y respeto del margen superior
  useEffect(() => {
    const applyStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && Capacitor.isPluginAvailable("StatusBar")) {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (e) {
        console.warn("StatusBar setup in Gracia:", e);
      }

      const themeMeta =
        document.getElementById("theme-color-meta") ||
        document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", "#ffffff");
      }
      document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
        tag.setAttribute("content", "#ffffff");
      });
      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
    };

    applyStatusBar();

    // Restablecer scroll al inicio
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, []);

  return (
    <div
      className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none overflow-x-hidden overflow-y-auto"
      id="android-thank-you-view"
    >
      {/* Barra de estado nativa en color blanco sólido */}
      <div
        className="w-full bg-white select-none pointer-events-none sticky top-0 z-40 shrink-0 transition-colors"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          minHeight: "env(safe-area-inset-top, 0px)",
          backgroundColor: "#ffffff",
        }}
        aria-hidden="true"
      />

      {/* Contenedor del contenido con margen respecto a la barra de estado */}
      <div
        className="relative z-10 px-4 flex flex-col flex-1 bg-white"
        style={{
          marginTop: "4px",
          paddingTop: "12px",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 85px)",
        }}
      >
        {/* Encabezado con icono de éxito y agradecimiento */}
        <EncabezadoConfirmacion />

        {/* Resumen de compra, productos comprados, dirección y totales */}
        <ResumenCompra
          lastOrderItems={lastOrderItems}
          lastDeliveryAddress={lastDeliveryAddress}
          lastContactInfo={lastContactInfo}
          subtotal={subtotal}
          effectiveShipping={effectiveShipping}
          lastShippingCarrier={lastShippingCarrier}
          thankYouTotal={thankYouTotal}
        />
      </div>

      {/* Pie de página fijo con acciones de navegación */}
      <AccionesConfirmacion
        onContinueShopping={onContinueShopping}
        onNavigateToHistory={onNavigateToHistory}
      />
    </div>
  );
}

export default GraciaTiendaView;
export { GraciaTiendaView as GrasiaTiendaView };
