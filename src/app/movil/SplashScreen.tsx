import React from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import brandIcon from "../../../assets/icon.png";

export interface AndroidSplashScreenProps {
  isLoading?: boolean;
  statusMessage?: string;
  hasError?: boolean;
  onRetry?: () => void;
  onContinueAnyway?: () => void;
}

export default function AndroidSplashScreen({
  statusMessage,
  hasError = false,
  onRetry,
}: AndroidSplashScreenProps) {
  return (
    <main
      className="fixed inset-0 z-[10000] flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-slate-900"
      role="status"
      aria-live="polite"
    >
      <img
        src={brandIcon}
        alt="Marca"
        className="mb-8 h-24 w-24 object-contain"
      />
      {hasError ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      ) : (
        <LoaderCircle className="h-9 w-9 animate-spin text-amber-500" aria-hidden="true" />
      )}
      <p className="mt-4 max-w-xs text-center text-sm font-medium text-slate-600">
        {statusMessage || "Preparando el catálogo..."}
      </p>
    </main>
  );
}
