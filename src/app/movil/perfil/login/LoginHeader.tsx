import { ArrowLeft } from "lucide-react";
import { AuthMode } from "./usePerfilLogin";

interface LoginHeaderProps {
  mode: AuthMode;
  onBack: () => void;
}

export default function LoginHeader({ mode, onBack }: LoginHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-5 pb-2 pt-[max(8px,env(safe-area-inset-top,8px))]">
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-lg font-black tracking-tight text-white">
          {mode === "register" ? "Crea tu cuenta" : "Inicia sesión"}
        </h1>
      </div>
    </header>
  );
}
