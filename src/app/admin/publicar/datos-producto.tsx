import { AlertCircle } from "lucide-react";

type Props = { scope: any };

export default function DatosProducto({ scope }: Props) {
 const { prodName, setProdName, prodCategory, setProdCategory, prodDescription, setProdDescription, prodPrice, setProdPrice, prodQuantity, setProdQuantity } = scope;
 return (
  <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  placeholder="Ej. Sudadera Oversized Neon"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
                >
                  <option value="Ropa Femenina">Ropa Femenina</option>
                  <option value="Ropa Masculina">Ropa Masculina</option>
                  <option value="Mascotas">Mascotas</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Salud">Salud</option>
                  <option value="Joyas">Joyas</option>
                  <option value="Bolsos">Bolsos</option>
                  <option value="Zapatos">Zapatos</option>
                  <option value="Juguetes">Juguetes</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Electrónica">Electrónica</option>
                  <option value="Automotriz">Automotriz</option>
                  <option value="Teléfonos">Teléfonos</option>
                  <option value="Informática">Informática</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Descripción Detallada *</label>
                <span className={`text-[10px] font-mono font-bold ${prodDescription.length >= 500 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {prodDescription.length} / 500 caracteres
                </span>
              </div>
              <textarea
                placeholder="Detalles del producto (máximo 500 caracteres)..."
                value={prodDescription}
                maxLength={500}
                onChange={(e) => setProdDescription(e.target.value.slice(0, 500))}
                rows={2}
                className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-medium"
                required
              />
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Atención: La descripción del producto sólo admite máximo 500 caracteres.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Precio ($) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad (Stock) *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Disponible"
                  value={prodQuantity}
                  onChange={(e) => setProdQuantity(e.target.value)}
                  className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
                  required
                />
              </div>
            </div>

  </>
 );
}
