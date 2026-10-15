import React from "react";

export interface SplashScreenProps {
  isLoading?: boolean;
  statusMessage?: string;
  hasError?: boolean;
  onRetry?: () => void;
  onContinueAnyway?: () => void;
  progress?: number;
}

/**
 * Pantalla intermedia eliminada a petición del usuario.
 * Retorna null inmediatamente para evitar cualquier pantalla negra o de carga al abrir la app.
 */
export default function SplashScreen(_props?: SplashScreenProps) {
  return null;
}
