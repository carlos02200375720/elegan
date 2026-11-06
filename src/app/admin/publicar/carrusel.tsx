import { X, Plus } from "lucide-react";

type Props = { scope: any };

export default function Carrusel({ scope }: Props) {
 const { carouselInputRef, carouselImageFiles, setCarouselImageFiles } = scope;
 return (
  <>
          {publishType === "carousel" && (
            <>
              <input
                type="file"
                ref={carouselInputRef}
                multiple
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setCarouselImageFiles([...carouselImageFiles, ...files]);
                }}
                className="hidden"
              />
              <div className="w-full space-y-4">
                {carouselImageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {carouselImageFiles.map((file, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100 shrink-0">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Carousel thumb" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => setCarouselImageFiles(carouselImageFiles.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-white/90 rounded text-slate-600 shadow-sm cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="cursor-pointer space-y-1" onClick={() => carouselInputRef.current?.click()}>
                  <div className="mx-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Agregar imágenes al carrusel</p>
                    <p className="text-[10px] text-slate-400 font-medium">Puedes subir múltiples imágenes (.png, .jpeg, .webp)</p>
                  </div>
                </div>
              </div>
            </>
          )}
  </>
 );
}
