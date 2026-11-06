import { Image as ImageIcon, Trash2, Loader2, CheckCircle2 } from "lucide-react";

type Props = { scope: any };

export default function Banner({ scope }: Props) {
 const { bannerLabel, bannerTitle, bannerDescription, bannerLink, bannerEnabled, setBannerLabel, setBannerTitle, setBannerDescription, setBannerLink, setBannerEnabled, bannerImageFile, setBannerImageFile, bannerImagePreview, setBannerImagePreview, errorMessage, successMessage, handleSaveBanner, bannerSaving } = scope;
 return (
  <>
      {showBannerSection ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Configurar banner de Inicio</h3>
            <p className="mt-1 text-xs text-slate-500">Prepara el contenido visual y promocional que aparecerá debajo de la cabecera de la app móvil.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Etiqueta</label>
                <input value={bannerLabel} onChange={(e) => setBannerLabel(e.target.value)} maxLength={35} placeholder="Ej. Cupón exclusivo" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Título de la promoción</label>
                <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} maxLength={70} placeholder="Ej. 20% de descuento en tu compra" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Descripción</label>
                <textarea value={bannerDescription} onChange={(e) => setBannerDescription(e.target.value)} maxLength={160} rows={3} placeholder="Describe brevemente la oferta, cupón o campaña..." className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">Enlace al pulsar el banner (opcional)</label>
                <input type="url" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-amber-500" />
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3">
                <span><span className="block text-xs font-bold text-slate-800">Banner activado</span><span className="block text-[10px] text-slate-500">Controla si la campaña debe mostrarse</span></span>
                <input type="checkbox" checked={bannerEnabled} onChange={(e) => setBannerEnabled(e.target.checked)} className="h-4 w-4 accent-amber-500" />
              </label>
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">Imagen publicitaria</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setBannerImageFile(file); setBannerImagePreview(URL.createObjectURL(file)); }} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-amber-900" />
              <p className="text-[10px] text-slate-500">Formatos JPG, PNG o WebP. Recomendado: imagen horizontal.</p>
              <div className="relative flex min-h-[150px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-950 p-4 text-center">
                {bannerImagePreview ? <img src={bannerImagePreview} alt="Vista previa del banner" className="absolute inset-0 h-full w-full object-cover" /> : <div className="relative z-10 text-white/70"><ImageIcon className="mx-auto mb-2 h-7 w-7" /><span className="text-xs font-bold">Vista previa de la imagen</span></div>}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
                <div className="relative z-10 mr-auto max-w-[85%] text-left text-white">
                  <span className="inline-block rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black uppercase text-slate-950">{bannerLabel || "Promoción"}</span>
                  <p className="mt-2 text-base font-extrabold">{bannerTitle || "Título de tu promoción"}</p>
                  <p className="mt-1 text-[10px] text-white/90">{bannerDescription || "Aquí aparecerá la descripción de la campaña."}</p>
                </div>
              </div>
              {bannerImageFile && <button type="button" onClick={() => { setBannerImageFile(null); setBannerImagePreview(""); }} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600"><Trash2 className="h-3.5 w-3.5" />Quitar imagen</button>}
            </div>
          </div>
          {errorMessage && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700">{errorMessage}</div>}
          {successMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700">{successMessage}</div>}
          <div className="flex justify-end">
            <button type="button" onClick={handleSaveBanner} disabled={bannerSaving || (!bannerTitle.trim() && bannerEnabled)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {bannerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {bannerSaving ? "Guardando promoción..." : "Guardar y publicar promoción"}
            </button>
          </div>
        </div>
      ) : (
  </>
 );
}
