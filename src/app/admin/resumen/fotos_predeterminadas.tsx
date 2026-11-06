import React from "react";
import { Loader2, Sparkles, Camera, Upload, RotateCcw, Check, UserCheck } from "lucide-react";
import { AVATAR_PRESETS, COVER_PRESETS, FALLBACK_DEFAULT_AVATAR, FALLBACK_DEFAULT_COVER } from "../utilidades/activosPredeterminados";
import { DatosResumen } from "./tipos";

export default function FotosPredeterminadas({ datos }: { datos: DatosResumen }) {
  const { activeAdminTab, defaultAvatar, setDefaultAvatar, defaultCoverPhoto, setDefaultCoverPhoto, isSavingDefaults, isResettingDefaults, avatarTabMode, setAvatarTabMode, coverTabMode, setCoverTabMode, customAvatarUrl, setCustomAvatarUrl, customCoverUrl, setCustomCoverUrl, handleSaveDefaultAssets, handleResetDefaultAssets, handleAvatarFileUpload, handleCoverFileUpload, applyCustomAvatarUrl, applyCustomCoverUrl } = datos;
  return (
    <>
      {activeAdminTab === 'fotos_defecto' && (
        <div className="space-y-6" id="admin-tab-content-fotos-defecto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>Personalización Global de Cuentas Nuevas</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Fotos Predeterminadas de Perfil y Portada
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Gestiona las imágenes oficiales que la app mostrará automáticamente cuando un usuario se registra por primera vez o si su perfil aún no cuenta con fotos personalizadas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleResetDefaultAssets}
                disabled={isResettingDefaults || isSavingDefaults}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                id="admin-reset-defaults-btn"
                title="Restablecer a valores de fábrica"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isResettingDefaults ? "animate-spin" : ""}`} />
                <span>{isResettingDefaults ? "Restableciendo..." : "Valores de Fábrica"}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDefaultAssets}
                disabled={isSavingDefaults}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                id="admin-save-defaults-btn"
              >
                {isSavingDefaults ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isSavingDefaults ? "Guardando Cambios..." : "Guardar Configuración"}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5" id="admin-default-avatar-card">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Foto de Perfil por Defecto (Avatar)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Icono circular que identifica a usuarios sin avatar propio
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setAvatarTabMode('upload')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTabMode === 'upload'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTabMode('presets')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTabMode === 'presets'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Galería
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTabMode('url')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTabMode === 'url'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Enlace
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-slate-100 shadow-lg bg-slate-100 flex items-center justify-center">
                      <img
                        src={defaultAvatar}
                        alt="Default avatar preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_DEFAULT_AVATAR;
                        }}
                      />
                    </div>
                    <label
                      htmlFor="admin-avatar-file-input"
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95"
                      title="Cambiar foto de perfil"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    {avatarTabMode === 'upload' && (
                      <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-2xl p-4 text-center transition-colors bg-slate-50/50">
                        <input
                          id="admin-avatar-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="admin-avatar-file-input"
                          className="cursor-pointer flex flex-col items-center space-y-1.5"
                        >
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-xs font-black text-slate-800">
                            Haz clic aquí o arrastra una imagen
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Formatos admitidos: JPG, PNG, WEBP (Se optimiza a GCS)
                          </span>
                        </label>
                      </div>
                    )}
                    {avatarTabMode === 'presets' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Elige uno de nuestros diseños predefinidos:
                        </span>
                        <div className="grid grid-cols-5 gap-2">
                          {AVATAR_PRESETS.map((p, pIdx) => {
                            const isSelected = defaultAvatar === p.url;
                            return (
                              <button
                                key={`${p.id}-${pIdx}`}
                                type="button"
                                onClick={() => setDefaultAvatar(p.url)}
                                className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-amber-500 ring-2 ring-amber-500/30 scale-105"
                                    : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                }`}
                                title={p.label}
                              >
                                <img
                                  src={p.url}
                                  alt={p.label}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {avatarTabMode === 'url' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Ingresa la URL directa de la imagen:
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={customAvatarUrl}
                            onChange={(e) => setCustomAvatarUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={applyCustomAvatarUrl}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5" id="admin-default-cover-card">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Foto de Portada por Defecto (Banner)
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Cabecera panorámica superior que adorna el perfil
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCoverTabMode('upload')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        coverTabMode === 'upload'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverTabMode('presets')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        coverTabMode === 'presets'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Galería
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverTabMode('url')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        coverTabMode === 'url'
                          ? "bg-white text-slate-950 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Enlace
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                    <img
                      src={defaultCoverPhoto}
                      alt="Default cover preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_DEFAULT_COVER;
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/20" />
                    <label
                      htmlFor="admin-cover-file-input"
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-xs flex items-center space-x-1.5 cursor-pointer shadow-lg transition-all active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cambiar Portada</span>
                    </label>
                  </div>
                  <div>
                    {coverTabMode === 'upload' && (
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 text-center transition-colors bg-slate-50/50">
                        <input
                          id="admin-cover-file-input"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="admin-cover-file-input"
                          className="cursor-pointer flex flex-col items-center space-y-1.5"
                        >
                          <Upload className="w-5 h-5 text-slate-400" />
                          <span className="text-xs font-black text-slate-800">
                            Haz clic o arrastra un banner panorámico
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Resolución recomendada: 1200x400 px o superior
                          </span>
                        </label>
                      </div>
                    )}
                    {coverTabMode === 'presets' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Elige una portada de nuestra colección:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {COVER_PRESETS.map((c, cIdx) => {
                            const isSelected = defaultCoverPhoto === c.url;
                            return (
                              <button
                                key={`${c.id}-${cIdx}`}
                                type="button"
                                onClick={() => setDefaultCoverPhoto(c.url)}
                                className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-amber-500 ring-2 ring-amber-500/30 scale-102"
                                    : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                }`}
                                title={c.label}
                              >
                                <img
                                  src={c.url}
                                  alt={c.label}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-950/20" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {coverTabMode === 'url' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Ingresa la URL directa de la imagen de portada:
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={customCoverUrl}
                            onChange={(e) => setCustomCoverUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={applyCustomCoverUrl}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Vista Previa en Vivo
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Tiempo Real
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Así se verá el encabezado de perfil para cualquier cuenta nueva o visitante registrado que no tenga fotos:
                </p>
                <div className="rounded-2xl overflow-hidden border border-slate-700 bg-white text-slate-900 shadow-lg">
                  <div className="h-28 bg-slate-900 relative overflow-hidden">
                    <img
                      src={defaultCoverPhoto}
                      alt="Banner Mockup"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_DEFAULT_COVER;
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/20" />
                  </div>
                  <div className="px-4 pb-4 pt-0 bg-slate-50 relative">
                    <div className="flex items-end justify-between -mt-9 mb-2">
                      <div className="relative">
                        <img
                          src={defaultAvatar}
                          alt="Avatar Mockup"
                          referrerPolicy="no-referrer"
                          className="w-18 h-18 rounded-full object-cover border-3 border-white shadow-md bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_DEFAULT_AVATAR;
                          }}
                        />
                      </div>
                      <div className="pt-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
                          Cuenta Nueva
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-black text-sm text-slate-900 leading-tight">
                        Cliente Registrado
                      </h4>
                      <p className="text-xs font-medium text-slate-500">
                        cliente@tienda.com
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium pt-1">
                        Cliente registrado en la tienda
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 pt-3 mt-2 border-t border-slate-200 text-[11px] font-bold text-slate-600">
                      <span>Cuenta de cliente verificada</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDefaultAssets}
                    disabled={isSavingDefaults}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-98 disabled:opacity-50"
                  >
                    {isSavingDefaults ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                    <span>{isSavingDefaults ? "Guardando en Base de Datos..." : "Aplicar y Guardar Fotos por Defecto"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}    </>
  );
}
