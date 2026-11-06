import { ProductShippingOption } from "../tipos";
import { Truck, Globe, Plus, Clock, Trash2, CheckCircle2 } from "lucide-react";

type Props = { scope: any };

export default function EnviosProducto({ scope }: Props) {
 const { newShipLabel, setNewShipLabel, newShipOrigin, setNewShipOrigin, newShipPrice, setNewShipPrice, newShipTime, setNewShipTime, prodShippingOptions, prodShippingCapital, setProdShippingCapital, prodShippingProvince, setProdShippingProvince, prodFreeShipping, setProdFreeShipping, handleSelectShippingPreset, handleAddShippingOption, handleUpdateShippingOption, handleRemoveShippingOption } = scope;
 return (
  <>
            {/* Estrategia y Configuración Manual de Envío del Producto */}
            <div className="border border-amber-200/80 rounded-xl p-4 bg-amber-50/40 space-y-4" id="product-shipping-config-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Configuración Manual de Envío (Por Origen, Precio y Tiempo)</span>
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                  China, Estados Unidos, Local, Express, etc.
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Configura manualmente todas las rutas de envío que desees para este producto (ej. <b>Envío desde China</b>, <b>Envío desde Estados Unidos</b>, <b>Capital / Provincia</b>) definiendo el <b>precio ($)</b> y el <b>tiempo de entrega</b> de cada una.
              </p>

              {/* 1. Plantillas Rápidas de Envío (1 clic para rellenar) */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-amber-600" />
                  <span>Plantillas rápidas de origen (Haz clic para pre-llenar):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SHIPPING_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectShippingPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        newShipLabel === preset.label
                          ? "bg-slate-950 text-amber-400 border-slate-950 shadow-2xs"
                          : "bg-white hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300"
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-[9px] text-slate-400 font-normal">({preset.defaultTime})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Creador Manual de Ruta / Opción de Envío */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-2xs space-y-3" id="manual-shipping-creator-box">
                <div className="text-[11px] font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Agregar Opción de Envío Manualmente</span>
                  <span className="text-[10px] font-normal text-slate-400">Puedes añadir múltiples orígenes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Nombre / Origen del Envío */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      1. Origen / Nombre del Envío *
                    </label>
                    <input
                      type="text"
                      id="input-manual-shipping-label"
                      placeholder="Ej. Envío desde China 🇨🇳, Envío de EE.UU. 🇺🇸..."
                      value={newShipLabel}
                      onChange={(e) => setNewShipLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddShippingOption();
                        }
                      }}
                      className="w-full text-xs font-sans p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-medium text-slate-900"
                    />
                  </div>

                  {/* Precio del Envío */}
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-700">
                        2. Precio ($ USD) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewShipPrice("0")}
                        className="text-[9px] font-extrabold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                      >
                        Poner $0 (Gratis)
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      id="input-manual-shipping-price"
                      placeholder="0.00"
                      value={newShipPrice}
                      onChange={(e) => setNewShipPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddShippingOption();
                        }
                      }}
                      className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-bold text-slate-900"
                    />
                  </div>

                  {/* Tiempo Estimado de Entrega */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>3. Tiempo de Entrega *</span>
                    </label>
                    <input
                      type="text"
                      id="input-manual-shipping-time"
                      placeholder="Ej. 10-20 días hábiles"
                      value={newShipTime}
                      onChange={(e) => setNewShipTime(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddShippingOption();
                        }
                      }}
                      className="w-full text-xs font-sans p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-medium text-slate-900"
                    />
                  </div>

                  {/* Botón Añadir */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      id="btn-add-manual-shipping"
                      onClick={handleAddShippingOption}
                      disabled={!newShipLabel.trim()}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 rounded-lg flex items-center justify-center space-x-1 text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>

                {/* Chips rápidos de tiempo de entrega */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400">Tiempos rápidos:</span>
                  {[
                    "24-48 horas",
                    "1-3 días hábiles",
                    "3-5 días hábiles",
                    "5-10 días hábiles",
                    "10-20 días hábiles",
                    "15-30 días hábiles",
                  ].map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewShipTime(t)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                        newShipTime === t
                          ? "bg-amber-500/20 border-amber-400 text-amber-900 font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Lista de Opciones de Envío Añadidas (Editables en vivo) */}
              {prodShippingOptions.length > 0 && (
                <div className="space-y-2" id="configured-shipping-options-list">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-800">
                      Opciones de Envío Configuradas ({prodShippingOptions.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Puedes editar el nombre, precio o tiempo directamente
                    </span>
                  </div>

                  <div className="space-y-2">
                    {prodShippingOptions.map((opt, idx) => (
                      <div
                        key={opt.id || idx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <div className="sm:col-span-5">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">Origen / Método</label>
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => handleUpdateShippingOption(idx, "label", e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">Precio ($ USD)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={opt.price}
                            onChange={(e) => handleUpdateShippingOption(idx, "price", e.target.value)}
                            className="w-full text-xs font-mono font-bold text-emerald-700 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">Tiempo Estimado</label>
                          <input
                            type="text"
                            value={opt.deliveryTime}
                            onChange={(e) => handleUpdateShippingOption(idx, "deliveryTime", e.target.value)}
                            className="w-full text-xs font-medium text-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end sm:pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveShippingOption(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar esta opción de envío"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Opciones Rápidas Adicionales (Capital, Provincia, Envío Gratis) */}
              <details className="bg-white/80 rounded-xl border border-slate-200/80 p-3 text-xs">
                <summary className="font-bold text-slate-700 cursor-pointer select-none flex items-center justify-between">
                  <span>Opciones rápidas locales adicionales (Capital / Provincia / Envío Gratis)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
                  {/* Campo 1: Precio de envío a la capital */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Envío a la Capital ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={prodShippingCapital}
                      onChange={(e) => setProdShippingCapital(e.target.value)}
                      id="input-shipping-capital"
                      className="w-full text-xs font-sans p-2 rounded-lg border font-medium bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Campo 2: Precio de envío a provincia */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Envío a Provincia ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={prodShippingProvince}
                      onChange={(e) => setProdShippingProvince(e.target.value)}
                      id="input-shipping-province"
                      className="w-full text-xs font-sans p-2 rounded-lg border font-medium bg-white border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Campo 3: Envío gratis */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Envío Gratis ($0)
                    </label>
                    <button
                      type="button"
                      id="toggle-free-shipping"
                      onClick={() => setProdFreeShipping(!prodFreeShipping)}
                      className={`w-full p-2 rounded-lg border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                        prodFreeShipping
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="flex items-center space-x-1">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${prodFreeShipping ? "text-white" : "text-slate-400"}`} />
                        <span>{prodFreeShipping ? "Activo" : "Activar"}</span>
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        prodFreeShipping ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}>
                        {prodFreeShipping ? "SÍ ($0)" : "NO"}
                      </span>
                    </button>
                  </div>
                </div>
              </details>

              {/* 5. Vista Previa de Botones de Envío que verá el cliente */}
              <div className="p-3 rounded-xl bg-white border border-amber-200/80 space-y-2 text-xs">
                <span className="text-slate-700 font-bold block">
                  Vista previa de los botones de envío que verá el cliente en la tienda:
                </span>
                {(() => {
                  const previewList: ProductShippingOption[] = [...prodShippingOptions];
                  if (newShipLabel.trim()) {
                    previewList.push({
                      label: newShipLabel.trim(),
                      price: Math.max(0, parseFloat(String(newShipPrice).replace(",", ".")) || 0),
                      deliveryTime: newShipTime.trim() || "5-10 días hábiles",
                    });
                  }
                  const cap = Math.max(0, parseFloat(String(prodShippingCapital).replace(",", ".")) || 0);
                  const prov = Math.max(0, parseFloat(String(prodShippingProvince).replace(",", ".")) || 0);
                  if (cap > 0 && !previewList.some((o) => o.label.toLowerCase().includes("capital"))) {
                    previewList.push({ label: "Envío a la Capital", price: cap, deliveryTime: "1-3 días hábiles" });
                  }
                  if (prov > 0 && !previewList.some((o) => o.label.toLowerCase().includes("provincia"))) {
                    previewList.push({ label: "Envío a Provincia", price: prov, deliveryTime: "3-5 días hábiles" });
                  }
                  if (prodFreeShipping && !previewList.some((o) => o.price === 0)) {
                    previewList.push({ label: "Envío Gratis", price: 0, deliveryTime: "1-5 días hábiles" });
                  }

                  if (previewList.length === 0) {
                    return (
                      <span className="text-slate-400 font-medium italic block">
                        Aún no has agregado opciones de envío (usa las plantillas de arriba o el formulario manual).
                      </span>
                    );
                  }

                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      {previewList.map((item, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 text-white border border-slate-900 text-[11px] font-extrabold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{item.label}:</span>
                          <span className="font-mono text-amber-400">
                            {item.price === 0 ? "GRATIS ($0.00)" : `$${item.price.toFixed(2)}`}
                          </span>
                          {item.deliveryTime && (
                            <span className="text-[10px] font-normal text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                              ⏱ {item.deliveryTime}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

  </>
 );
}
