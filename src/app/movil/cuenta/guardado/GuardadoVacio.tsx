import { Bookmark } from "lucide-react";

export default function GuardadoVacio() {
  return (
    <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
        <Bookmark className="w-6 h-6" />
      </div>
      <p className="font-bold text-slate-700">No tienes publicaciones ni productos guardados</p>
      <p className="text-[11px] text-slate-400 mt-1 max-w-xs text-center">
        Guarda productos en la tienda o publicaciones tocando el icono de guardado para encontrarlos aquí fácilmente.
      </p>
    </div>
  );
}
