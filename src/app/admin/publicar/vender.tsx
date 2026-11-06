import { X, Plus, Upload } from "lucide-react";

type Props = { scope: any };

export default function Vender({ scope }: Props) {
 const { publishType, prodPhotosRef, productPhotoFiles, setProductPhotoFiles, prodVideoRef, productVideoFile, setProductVideoFile, newColorImageInputRef, existingColorImageInputRef, newColorName, newColorFile, setNewColorFile, colorImageFiles, colorImagePreviews, editingColorTarget, setEditingColorTarget } = scope;
 return (
  <>
          {publishType === "product" && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Photos */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white/50">
                <p className="text-xs font-bold text-slate-700 mb-2">Fotos del Producto *</p>
                <input
                  type="file"
                  ref={prodPhotosRef}
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setProductPhotoFiles([...productPhotoFiles, ...files]);
                  }}
                  className="hidden"
                />
                
                <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] justify-center items-center">
                  {/* Uploaded Local Files */}
                  {productPhotoFiles.map((file, idx) => (
                    <div key={idx} className="w-12 h-12 rounded overflow-hidden border border-slate-150 relative">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProductPhotoFiles(productPhotoFiles.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 p-0.5 bg-white/90 rounded text-slate-600 cursor-pointer"
                      >
                        <X className="w-2 h-2 text-rose-500" />
                      </button>
                    </div>
                  ))}
                  {productPhotoFiles.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">No hay fotos seleccionadas</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => prodPhotosRef.current?.click()}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir Fotos Locales</span>
                </button>
              </div>

              {/* Product Video */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white/50">
                <p className="text-xs font-bold text-slate-700 mb-2">Video del Producto (Opcional)</p>
                <input
                  type="file"
                  ref={prodVideoRef}
                  accept="video/mp4, video/quicktime, video/webm, video/x-m4v, video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProductVideoFile(file);
                  }}
                  className="hidden"
                />

                {productVideoFile ? (
                  <div className="mb-3">
                    <VideoUploadPreview
                      file={productVideoFile}
                      compact={true}
                      onRemove={() => setProductVideoFile(null)}
                      onChangeFile={() => prodVideoRef.current?.click()}
                    />
                  </div>
                ) : (
                  <div className="h-[48px] flex items-center justify-center text-center text-slate-400 text-[10px] italic border border-dashed border-slate-200 rounded mb-3">
                    Sin video seleccionado (se procesará a stream HLS)
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => prodVideoRef.current?.click()}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir Video</span>
                </button>
              </div>
            </div>
          )}
  </>
 );
}
