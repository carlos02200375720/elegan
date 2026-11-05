import { AuthMode } from "./usePerfilLogin";

interface LoginFooterProps {
  mode: AuthMode;
  isLoading: boolean;
}

export default function LoginFooter({ mode, isLoading }: LoginFooterProps) {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col justify-start box-border border-t border-slate-200 bg-white px-4"
      style={{
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        minHeight: "calc(60px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="mx-auto flex h-[60px] min-h-[60px] max-h-[60px] w-full max-w-md items-center">
        <button
          type="submit"
          form="perfil-login-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isLoading
            ? "Procesando..."
            : mode === "register"
              ? "Crear cuenta y guardar mis datos"
              : "Iniciar sesión y recuperar mis datos"}
        </button>
      </div>
    </footer>
  );
}
