import { useEstadoAcceso } from "./estado";
import PanelMarca from "./PanelMarca";
import FormularioAcceso from "./FormularioAcceso";
import type { LoginViewProps } from "./tipos";

export type { LoginViewProps } from "./tipos";

export default function LoginView(props: LoginViewProps) {
  const estado = useEstadoAcceso(props);

  return (
    <div
      className="w-full max-w-full min-h-screen bg-white text-slate-900 flex flex-col justify-start md:justify-center items-center px-3 sm:px-6 relative overflow-x-hidden overflow-y-auto no-scrollbar"
      id="auth-root-view"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        paddingBottom: "calc(44px + env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row z-10 min-h-[500px] mb-0">
        <PanelMarca />
        <FormularioAcceso estado={estado} />
      </div>
    </div>
  );
}
