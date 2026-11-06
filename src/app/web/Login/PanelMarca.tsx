import { MessageSquare, Play, ShoppingBag } from "lucide-react";

export default function PanelMarca() {
  return (
    <div className="md:w-5/12 bg-slate-50 p-6 sm:p-8 flex flex-col justify-between text-slate-900 relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-slate-200">
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-amber-100/20 to-white opacity-90 z-0" />
      <div className="relative z-10">
        <div className="flex items-center space-x-2.5 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1.5 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-amber-700">ELEGAN</span>
        </div>
        <h1 className="font-display font-black text-2xl mt-6 leading-tight tracking-tight text-slate-900">
          Descubre. Elige. <span className="text-amber-500">Disfruta.</span>
        </h1>
        <p className="text-xs font-semibold text-slate-700 mt-3 leading-relaxed">
          Mucho más que comprar, una nueva forma de descubrir lo que te gusta.
        </p>
        <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
          En Elegan encontrarás una experiencia de compra diferente. Explora productos, descubre novedades en videos y encuentra fácilmente lo que buscas. Todo en una sola tienda, diseñada para que comprar sea sencillo, cómodo y agradable.
        </p>
      </div>

      <div className="space-y-4 my-6 md:my-0 relative z-10">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-600 shrink-0 border border-amber-500/25"><Play className="w-3.5 h-3.5 fill-current" /></div>
          <div><h4 className="text-xs font-bold text-slate-900">Productos que cobran vida</h4><p className="text-[10px] text-slate-500 leading-normal">Descubre nuestros productos en videos y conoce sus detalles antes de elegir.</p></div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-600 shrink-0 border border-amber-500/25"><ShoppingBag className="w-3.5 h-3.5" /></div>
          <div><h4 className="text-xs font-bold text-slate-900">Todo en un solo lugar</h4><p className="text-[10px] text-slate-500 leading-normal">Explora nuestro catálogo, encuentra tus favoritos y descubre nuevas opciones.</p></div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-amber-500/15 rounded-lg text-amber-600 shrink-0 border border-amber-500/25"><MessageSquare className="w-3.5 h-3.5" /></div>
          <div><h4 className="text-xs font-bold text-slate-900">Atención personalizada</h4><p className="text-[10px] text-slate-500 leading-normal">¿Tienes alguna pregunta? Chatea con nosotros y recibe atención directa durante tu experiencia de compra.</p></div>
        </div>
        <p className="text-[10px] font-bold text-amber-700 tracking-wide leading-relaxed">Elegan: tus productos favoritos están a un clic de distancia.</p>
      </div>
    </div>
  );
}
