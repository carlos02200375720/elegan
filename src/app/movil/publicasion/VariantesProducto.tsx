import React from "react";
import { Image as ImageIcon, Plus, Tag, Trash2, Upload, X } from "lucide-react";
import type { ProductVariantsProps } from "./TiposPublicasion";
export default function VariantesProducto({ prodVariants, newColorName, setNewColorName, newColorFile, setNewColorFile, colorImageFiles, setColorImageFiles, colorImagePreviews, setColorImagePreviews, prodVariantList, setProdVariantList, editingColorTarget, setEditingColorTarget, newVarName, setNewVarName, newVarValue, setNewVarValue, newColorImageInputRef, existingColorImageInputRef, price, handleAddColorVariant, handleAssignColorImage, handleRemoveVariant, handleRemoveVariantOption, handleAddVariant }: ProductVariantsProps) {
  return (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Tag className="w-4 h-4" />
                      <span>Variantes del Producto (Colores con Imagen, Tallas)</span>
                    </span>
                  </div>
    
                  <input
                    type="file"
                    ref={existingColorImageInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && editingColorTarget) {
                        handleAssignColorImage(editingColorTarget, file);
                      }
                      setEditingColorTarget(null);
                      e.target.value = "";
                    }}
                  />
    
                  {/* Dedicated Color Variant Creator with Image */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5">
                    <span className="text-[11px] font-extrabold text-white block">
                      Crear Variante de Color (Nombre + Imagen del Color)
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Ej: Escribe "Azul" y carga una imagen que represente ese color para el detalle del producto.
                    </p>
    
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre del color (Ej. Azul, Rojo, Negro...)"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
    
                      <input
                        type="file"
                        ref={newColorImageInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setNewColorFile(file);
                        }}
                        className="hidden"
                      />
    
                      <div className="flex items-center gap-2">
                        {newColorFile ? (
                          <div className="flex-1 flex items-center gap-2 p-1.5 bg-slate-900 border border-amber-500/40 rounded-xl">
                            <img
                              src={URL.createObjectURL(newColorFile)}
                              alt="Color preview"
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                            <span className="text-[10px] text-slate-200 font-bold truncate flex-1">{newColorFile.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewColorFile(null);
                                if (newColorImageInputRef.current) newColorImageInputRef.current.value = "";
                              }}
                              className="p-1 text-rose-400 hover:text-rose-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => newColorImageInputRef.current?.click()}
                            className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cargar imagen del color</span>
                          </button>
                        )}
    
                        <button
                          type="button"
                          onClick={handleAddColorVariant}
                          disabled={!newColorName.trim()}
                          className="py-2.5 px-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Añadir Color</span>
                        </button>
                      </div>
                    </div>
                  </div>
    
                  {/* Active variants list */}
                  {prodVariants.length > 0 && (
                    <div className="space-y-2">
                      {prodVariants.map((variant, index) => {
                        const isColorGroup = variant.name.trim().toLowerCase().includes("color");
                        return (
                          <div key={index} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{variant.name}:</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(index)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
    
                            {isColorGroup ? (
                              <div className="grid grid-cols-2 gap-2">
                                {variant.options.map((opt, idx) => {
                                  const colorKey = opt.trim().toLowerCase();
                                  const previewImg =
                                    colorImagePreviews[colorKey] ||
                                    prodVariantList.find((item) => (item.color || item.name || "").trim().toLowerCase() === colorKey)?.imageUrl;
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {previewImg ? (
                                          <img src={previewImg} alt={opt} className="w-9 h-9 rounded-md object-cover border border-amber-500/40 shrink-0" />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingColorTarget(opt);
                                              existingColorImageInputRef.current?.click();
                                            }}
                                            className="w-9 h-9 rounded-md border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-400 shrink-0"
                                          >
                                            <ImageIcon className="w-4 h-4" />
                                          </button>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-[11px] font-bold text-white truncate">{opt}</p>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingColorTarget(opt);
                                              existingColorImageInputRef.current?.click();
                                            }}
                                            className="text-[9px] font-bold text-amber-400 underline"
                                          >
                                            {previewImg ? "Cambiar foto" : "Cargar foto"}
                                          </button>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantOption(index, opt)}
                                        className="text-slate-500 hover:text-rose-400 p-1 shrink-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {variant.options.map((opt, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-800">
                                    <span>{opt}</span>
                                    <button type="button" onClick={() => handleRemoveVariantOption(index, opt)} className="text-slate-500 hover:text-rose-400">
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
    
                  {/* Add another variant (e.g. Talla) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Otra variante (ej: Talla)"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Opciones (ej: S, M, L)"
                        value={newVarValue}
                        onChange={(e) => setNewVarValue(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
  );
}
