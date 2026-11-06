import { Tag, Image as ImageIcon, X, Upload, Plus, Trash2 } from "lucide-react";

type Props = { scope: any };

export default function Componente({ scope }: Props) {
 const { prodVariants, prodVariantList, colorImagePreviews, newColorName, setNewColorName, newColorFile, setNewColorFile, newColorImageInputRef, existingColorImageInputRef, editingColorTarget, setEditingColorTarget, handleAddColorVariant, handleRemoveVariant, handleRemoveVariantOption, handleAddVariant, handleAssignColorImage, newVarName, setNewVarName, newVarValue, setNewVarValue } = scope;
 return (
  <>
            {/* Product Variants (Talla / Color) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Variantes del Producto (Tallas, Colores con Imagen, etc.)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Define las opciones que desees</span>
              </div>

              {/* Hidden file input for assigning/changing image of an existing color */}
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

              {/* Dedicated Color Variant Creator with Image Upload */}
              <div className="bg-white border border-amber-200/90 rounded-xl p-3.5 shadow-2xs space-y-3" id="color-variant-creator-section">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>Crear Variante de Color del Producto (Nombre + Imagen)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200/60">
                    Se mostrará en el detalle del producto
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Escribe el nombre del color (ej: <b>Azul</b>) y carga una imagen que represente ese color (ej: foto de la camisa azul).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* 1. Color Name Input */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      1. Nombre del Color
                    </label>
                    <input
                      type="text"
                      id="input-color-variant-name"
                      placeholder="Ej. Azul, Rojo, Negro, Blanco..."
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddColorVariant();
                        }
                      }}
                      className="w-full text-xs font-sans p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  {/* 2. Color Image Upload */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      2. Imagen del Color (Opcional)
                    </label>
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
                    {newColorFile ? (
                      <div className="flex items-center space-x-2 p-1.5 bg-amber-50/60 border border-amber-300 rounded-lg">
                        <img
                          src={URL.createObjectURL(newColorFile)}
                          alt="Color preview"
                          className="w-8 h-8 rounded-md object-cover border border-amber-200 shrink-0"
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate flex-1">
                          {newColorFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewColorFile(null);
                            if (newColorImageInputRef.current) newColorImageInputRef.current.value = "";
                          }}
                          className="p-1 hover:bg-amber-100 rounded text-rose-500 cursor-pointer"
                          title="Quitar imagen"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="btn-upload-color-variant-image"
                        onClick={() => newColorImageInputRef.current?.click()}
                        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-amber-500 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cargar imagen del color</span>
                      </button>
                    )}
                  </div>

                  {/* 3. Add Color Button */}
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      id="btn-add-color-variant"
                      onClick={handleAddColorVariant}
                      disabled={!newColorName.trim()}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 rounded-lg flex items-center justify-center space-x-1.5 text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir Color</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active variants list */}
              {prodVariants.length > 0 && (
                <div className="space-y-2.5">
                  {prodVariants.map((variant, index) => {
                    const isColorGroup = variant.name.trim().toLowerCase().includes("color");
                    return (
                      <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{variant.name}:</span>
                            {isColorGroup && (
                              <span className="text-[10px] font-normal text-slate-500">
                                (Haz clic en "Cargar foto" en cualquier color para asignarle su imagen)
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(index)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Eliminar grupo de variante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isColorGroup ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                            {variant.options.map((opt, idx) => {
                              const colorKey = opt.trim().toLowerCase();
                              const previewImg =
                                colorImagePreviews[colorKey] ||
                                prodVariantList.find((item) => (item.color || item.name || "").trim().toLowerCase() === colorKey)?.imageUrl;

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-amber-400 transition-colors"
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    {previewImg ? (
                                      <img
                                        src={previewImg}
                                        alt={opt}
                                        className="w-11 h-11 rounded-lg object-cover border border-amber-300 shrink-0 bg-white"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingColorTarget(opt);
                                          existingColorImageInputRef.current?.click();
                                        }}
                                        className="w-11 h-11 rounded-lg border border-dashed border-slate-300 hover:border-amber-500 bg-white flex flex-col items-center justify-center text-slate-400 hover:text-amber-600 shrink-0 cursor-pointer transition-colors"
                                        title={`Subir imagen para ${opt}`}
                                      >
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-[8px] font-bold mt-0.5">Foto</span>
                                      </button>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold text-slate-900 truncate">{opt}</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingColorTarget(opt);
                                          existingColorImageInputRef.current?.click();
                                        }}
                                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer flex items-center gap-0.5 mt-0.5"
                                      >
                                        <Upload className="w-2.5 h-2.5" />
                                        <span>{previewImg ? "Cambiar foto" : "Cargar foto"}</span>
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantOption(index, opt)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                                    title={`Quitar color ${opt}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {variant.options.map((opt, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200/80"
                              >
                                <span>{opt}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantOption(index, opt)}
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                                  title={`Quitar ${opt}`}
                                >
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

              {/* New general variant form (e.g. Talla, Material) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Otra Variante (ej: Talla, Material)</label>
                  <input
                    type="text"
                    placeholder="Nombre de la variante (ej. Talla)"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    className="w-full text-xs font-sans p-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Opciones (separadas por comas)</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      placeholder="Ej. S, M, L, XL"
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      className="flex-1 text-xs font-sans p-2 rounded-lg border border-slate-200 bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
  </>
 );
}
