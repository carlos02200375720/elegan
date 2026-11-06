import EncabezadoSoporte from "./Encabezado";
import ListaConversaciones from "./ListaConversaciones";
import VistaConversacion from "./VistaConversacion";
import { useEstadoSoporte } from "./estado";
import type { SocialPanelProps } from "./tipos";

export type { SocialPanelProps } from "./tipos";

export default function SocialPanel(props: SocialPanelProps) {
  const estado = useEstadoSoporte(props);
  const propiedades = { ...props, ...estado };
  return (
    <div className="w-full bg-slate-100 flex flex-col justify-between text-slate-900 relative h-[calc(100dvh-4rem)] md:h-[calc(100dvh)] font-sans select-none overflow-hidden" id="social-support-chat-page">
      <EncabezadoSoporte props={propiedades} />
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
        <ListaConversaciones props={propiedades} />
        <VistaConversacion props={propiedades} />
      </div>
    </div>
  );
}
