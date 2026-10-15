import React from "react";

export interface AndroidSplashScreenProps {
  isLoading?: boolean;
  statusMessage?: string;
  hasError?: boolean;
  onRetry?: () => void;
  onContinueAnyway?: () => void;
}

/**
 * Pantalla intermedia eliminada a petición del usuario.
 * Retorna null inmediatamente para abrir de forma instantánea la app móvil.
 */
export default function AndroidSplashScreen(_props?: AndroidSplashScreenProps) {
  return null;
}
