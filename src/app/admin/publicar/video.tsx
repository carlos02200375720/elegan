import { Image as ImageIcon, X, Upload } from "lucide-react";
import VideoUploadPreview from "../../web/components/VideoUploadPreview";

type Props = { scope: any };

export default function Video({ scope }: Props) {
 const { videoInputRef, singleVideoFile, setSingleVideoFile, videoCoverFile, setVideoCoverFile, videoCoverInputRef } = scope;
 return (
  <>
          {publishType === "video" && (
            <>
              <input
                type="file"
                ref={videoInputRef}
                accept="video/mp4, video/quicktime, video/webm, video/x-m4v, video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSingleVideoFile(file);
                }}
                className="hidden"
              />
              {singleVideoFile ? (
                <div className="space-y-4 w-full max-w-xl">
                  {/* Interactive Video Preview Player and Metadata Summary */}
                  <VideoUploadPreview
                    file={singleVideoFile}
                    coverFile={videoCoverFile}
                    onRemove={() => setSingleVideoFile(null)}
                    onChangeFile={() => videoInputRef.current?.click()}
                  />
                  
                  {/* Custom video cover selector */}
                  <div className="mt-3 pt-3 border-t border-slate-200 w-full text-left">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Portada / Imagen de Miniatura</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                    </label>
                    <input
                      type="file"
                      ref={videoCoverInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVideoCoverFile(file);
                      }}
                      className="hidden"
                    />
                    {videoCoverFile ? (
                      <div className="flex items-center space-x-2.5 p-2 bg-slate-100 rounded-lg">
                        <img
                          src={URL.createObjectURL(videoCoverFile)}
                          alt="Portada"
                          className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-semibold text-slate-800 truncate">{videoCoverFile.name}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">Portada personalizada</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVideoCoverFile(null)}
                          className="p-1 hover:bg-slate-200 text-slate-500 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoCoverInputRef.current?.click()}
                        className="w-full py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Subir portada propia (Imagen)</span>
                      </button>
                    )}
                    {!videoCoverFile && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        * Si no subes una imagen, la app generará automáticamente la portada desde tu video.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="cursor-pointer space-y-2" onClick={() => videoInputRef.current?.click()}>
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Arrastra o haz clic para subir tu Video Reel</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Soporta cualquier formato de video (transcodificación exclusiva a HLS .m3u8)</p>
                  </div>
                </div>
              )}
            </>
          )}
  </>
 );
}
