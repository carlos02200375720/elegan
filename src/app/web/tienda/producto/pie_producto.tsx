import { FileText, ShieldCheck, Star, Truck } from "lucide-react";
import type { Product } from "../../../../types";

export function PieProducto({ selectedProduct }: { selectedProduct: Product }) {
  return (
    <>
      {/* Product Description Section */}
      {selectedProduct.description && (
        <div
          className="mt-6 md:mt-8 bg-white rounded-2xl border-0 p-5 sm:p-7 mx-0 md:mx-6"
          id="product-detail-description-container"
        >
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Descripción del Producto
            </h2>
          </div>
          <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {selectedProduct.description}
          </div>
        </div>
      )}

      {/* Security badges */}
      <div className="px-4 md:px-6 mt-4 pb-20 md:pb-10">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-semibold">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
            <span>Pago Seguro</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200/60">
            <Truck className="w-5 h-5 text-amber-500 mb-1" />
            <span>Envío Rápido</span>
          </div>
          <div className="flex flex-col items-center">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 mb-1" />
            <span>Garantía Oficial</span>
          </div>
        </div>
      </div>
    </>
  );
}
