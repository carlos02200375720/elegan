import React from "react";
import { CheckCircle2, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "../../utilidades/moneda";
import VariantesProducto from "./VariantesProducto";
import type { ProductFormProps } from "./TiposPublicasion";
export default function FormularioProducto({ image, setImage, imageInputRef, name, setName, price, setPrice, stock, setStock, shippingCapital, setShippingCapital, shippingProvince, setShippingProvince, freeShipping, setFreeShipping, category, setCategory, productDescription, setProductDescription, variantProps }: ProductFormProps) {
  return (
              <div className="space-y-4">
                {/* Product Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Foto del Producto
                  </label>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-sm text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <ImageIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{image ? image.name : "Seleccionar imagen"}</span>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold flex-shrink-0 ml-2">Explorar</span>
                    <input
                      ref={imageInputRef}
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                  </button>
                </div>
    
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre del Producto <span className="text-amber-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Chaqueta Vintage con Cinturón"
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
    
                {/* Product Price & Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Precio (USD) <span className="text-amber-500">*</span>
                    </label>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
    
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Stock <span className="text-amber-500">*</span>
                    </label>
                    <input
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="10"
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
    
                {/* 3 Campos de Configuración de Envío */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">Configuración de Envío (3 campos)</span>
                  </div>
    
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Precio de envío a la capital */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        1. Precio de envío a la capital (USD)
                      </label>
                      <input
                        value={shippingCapital}
                        onChange={(e) => setShippingCapital(e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full p-3 rounded-xl border text-sm transition-colors bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
    
                    {/* 2. Precio de envío a provincia */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        2. Precio de envío a provincia (USD)
                      </label>
                      <input
                        value={shippingProvince}
                        onChange={(e) => setShippingProvince(e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full p-3 rounded-xl border text-sm transition-colors bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
    
                    {/* 3. Envío gratis */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        3. Envío gratis
                      </label>
                      <button
                        type="button"
                        onClick={() => setFreeShipping(!freeShipping)}
                        className={`w-full p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                          freeShipping
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{freeShipping ? "Envío Gratis Activo" : "Activar Envío Gratis"}</span>
                        </span>
                        <span className="font-mono text-[10px]">
                          {freeShipping ? "SÍ ($0)" : "NO"}
                        </span>
                      </button>
                    </div>
                  </div>
    
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">Botones de envío:</span>
                    {(() => {
                      const cap = Math.max(0, parseFloat(String(shippingCapital).replace(",", ".")) || 0);
                      const prov = Math.max(0, parseFloat(String(shippingProvince).replace(",", ".")) || 0);
                      const showFree = freeShipping;
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                          {cap > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/40">
                              Capital: {formatPrice(cap)}
                            </span>
                          )}
                          {prov > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/40">
                              Provincia: {formatPrice(prov)}
                            </span>
                          )}
                          {showFree && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/40">
                              Envío Gratis ($0.00 USD)
                            </span>
                          )}
                          {cap <= 0 && prov <= 0 && !showFree && (
                            <span className="text-slate-500">Sin opciones seleccionadas</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
    
                {/* Product Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
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
                    <option value="Moda">Moda</option>
                    <option value="Calzado">Calzado</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Belleza">Belleza</option>
                  </select>
                </div>
    
                {/* Product Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descripción del Producto
                  </label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Detalla materiales, tallas, cuidados..."
                    rows={3}
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
    
                <VariantesProducto {...variantProps} />
              </div>
  );
}
