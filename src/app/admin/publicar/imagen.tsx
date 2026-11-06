import { X, Upload } from "lucide-react";

type Props = { scope: any };

export default function Imagen({ scope }: Props) {
 const { imageInputRef, singleImageFile, setSingleImageFile } = scope;
 return (
  <>
          {publishType === "image" && (
            <>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSingleImageFile(file);
                }}
                className="hidden"
              />
              {singleImageFile ? (
                <div className="space-y-3">
                  <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                    <img 
                      src={URL.createObjectURL(singleImageFile)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => setSingleImageFile(null)}
                      className="absolute top-1 right-1 p-1 bg-white/95 hover:bg-white text-slate-700 rounded-md shadow-sm cursor-pointer"
                    >
                      <X className="w-3 h-3 text-rose-500" />
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block">{singleImageFile.name}</span>
                </div>
              ) : (
                <div className="cursor-pointer space-y-2" onClick={() => imageInputRef.current?.click()}>
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Arrastra o haz clic para subir tu Imagen</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Formatos: .png, .jpeg, .webp</p>
                  </div>
                </div>
              )}
            </>
          )}
  </>
 );
}
