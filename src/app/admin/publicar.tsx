import React, { useState, useRef, useEffect } from "react";
import { User, Product, Reel, ProductVariantItem, ProductShippingOption } from "../../types";
import { 
  ArrowLeft, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  ShoppingBag, 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Tag,
  Download,
  Truck,
  Globe,
  PackageCheck,
  RefreshCw,
  Clock
} from "lucide-react";
import { apiFetch, getApiUrl } from "../../config";
import Banner from "./publicar/banner";
import Vender from "./publicar/vender";
import DatosProducto from "./publicar/datos-producto";
import EnviosProducto from "./publicar/envios-producto";
import VariantesProducto from "./publicar/variantes-producto";
import { procesarPublicacion } from "./publicar/procesar-publicacion";
import { crearUtilidadesSubida } from "./publicar/subida-archivos";
import { crearGestoresProducto } from "./publicar/gestionar-producto";
import Carrusel from "./publicar/carrusel";
import Imagen from "./publicar/imagen";
import VideoForm from "./publicar/video";

export interface PublishViewProps {
  currentUser: User;
  onBack: () => void;
  onSuccess: () => void;
  userProducts: Product[];
  initialTab?: PublishType;
}

export type PublishType = "video" | "image" | "carousel" | "product";

export default function PublishView({ currentUser, onBack, onSuccess, userProducts, initialTab = "video" }: PublishViewProps) {
  const [publishType, setPublishType] = useState<PublishType>(initialTab);
  const [showBannerSection, setShowBannerSection] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [bannerLabel, setBannerLabel] = useState("Promoción");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState("");
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!showBannerSection) return;
    let cancelled = false;
    apiFetch("/api/admin/banner").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (cancelled || !data?.banner) return;
      setBannerLabel(data.banner.label || "Promoción");
      setBannerTitle(data.banner.title || "");
      setBannerDescription(data.banner.description || "");
      setBannerLink(data.banner.link || "");
      setBannerImagePreview(data.banner.imageUrl || "");
      setBannerEnabled(data.banner.enabled !== false);
    }).catch((error) => console.warn("[Banner] No se pudo cargar la configuración:", error));
  return () => { cancelled = true; };
  }, [showBannerSection]);

  const handleSaveBanner = async () => {
    setBannerSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      let imageUrl = bannerImagePreview.startsWith("blob:") ? "" : bannerImagePreview;
      if (bannerImageFile) {
        const mime = bannerImageFile.type || "image/jpeg";
        const signedResponse = await fetch(getApiUrl(`/api/v1/media/upload-url?folder=promociones&file_type=${encodeURIComponent(mime)}&file_name=${encodeURIComponent(bannerImageFile.name)}`));
        if (!signedResponse.ok) throw new Error("No se pudo preparar la subida de la imagen.");
        const signed = await signedResponse.json();
        if (!signed.upload_url || !signed.public_url) throw new Error("El servidor no devolvió la URL de subida.");
        const uploadResponse = await fetch(signed.upload_url, { method: "PUT", headers: { "Content-Type": mime }, body: bannerImageFile });
        if (!uploadResponse.ok) throw new Error("No se pudo subir la imagen publicitaria.");
        imageUrl = signed.public_url;
      }
      const response = await apiFetch("/api/admin/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: bannerLabel,
          title: bannerTitle,
          description: bannerDescription,
          link: bannerLink,
          imageUrl,
          enabled: bannerEnabled
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo guardar la promoción.");
      setBannerImagePreview(imageUrl);
      setBannerImageFile(null);
      setSuccessMessage("Promoción guardada correctamente.");
    } catch (error: any) {
      setErrorMessage(error?.message || "Error al guardar la promoción.");
    } finally {
      setBannerSaving(false);
    }
  };

  // General publication states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taggedProductId, setTaggedProductId] = useState("");

  // Product specific states
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodShippingCapital, setProdShippingCapital] = useState("");
  const [prodShippingProvince, setProdShippingProvince] = useState("");
  const [prodFreeShipping, setProdFreeShipping] = useState(false);
  const [prodShippingOptions, setProdShippingOptions] = useState<ProductShippingOption[]>([]);
  const [newShipLabel, setNewShipLabel] = useState("");
  const [newShipOrigin, setNewShipOrigin] = useState("");
  const [newShipPrice, setNewShipPrice] = useState("");
  const [newShipTime, setNewShipTime] = useState("10-20 días hábiles");
  const [prodQuantity, setProdQuantity] = useState("");
  const [prodCategory, setProdCategory] = useState("Ropa Femenina");
  const [prodVariants, setProdVariants] = useState<{ name: string; options: string[] }[]>([
    { name: "Talla", options: ["S", "M", "L"] },
    { name: "Color", options: ["Negro", "Blanco"] }
  ]);
  const [prodVariantList, setProdVariantList] = useState<ProductVariantItem[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");

  // Color variant with image states
  const [newColorName, setNewColorName] = useState("");
  const [newColorFile, setNewColorFile] = useState<File | null>(null);
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, File>>({});
  const [colorImagePreviews, setColorImagePreviews] = useState<Record<string, string>>({});
  const [editingColorTarget, setEditingColorTarget] = useState<string | null>(null);

  // Media files states
  const [singleVideoFile, setSingleVideoFile] = useState<File | null>(null);
  const [videoCoverFile, setVideoCoverFile] = useState<File | null>(null);
  const [singleImageFile, setSingleImageFile] = useState<File | null>(null);
  const [carouselImageFiles, setCarouselImageFiles] = useState<File[]>([]);
  const [productPhotoFiles, setProductPhotoFiles] = useState<File[]>([]);
  const [productVideoFile, setProductVideoFile] = useState<File | null>(null);

  // Drag and drop feedback
  const [isDragging, setIsDragging] = useState(false);

  // File input refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoCoverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const prodPhotosRef = useRef<HTMLInputElement>(null);
  const prodVideoRef = useRef<HTMLInputElement>(null);
  const newColorImageInputRef = useRef<HTMLInputElement>(null);
  const existingColorImageInputRef = useRef<HTMLInputElement>(null);

  const { validateFileExtension, generateVideoThumbnail, uploadFileToGCS, uploadFilesSequentially } = crearUtilidadesSubida(currentUser, apiFetch, getApiUrl);

  const gestoresProducto = crearGestoresProducto({ prodVariants, setProdVariants, newColorName, setNewColorName, newColorFile, setNewColorFile, newColorImageInputRef, setColorImageFiles, setColorImagePreviews, setProdVariantList, prodPrice, prodVariantList, setEditingColorTarget, newVarName, setNewVarName, newVarValue, setNewVarValue, newShipLabel, setNewShipLabel, newShipOrigin, setNewShipOrigin, newShipPrice, setNewShipPrice, newShipTime, setNewShipTime, setProdShippingOptions });
  const { handleAddColorVariant, handleAssignColorImage, handleRemoveVariantOption, handleAddVariant, handleRemoveVariant, SHIPPING_PRESETS, handleSelectShippingPreset, handleAddShippingOption, handleUpdateShippingOption, handleRemoveShippingOption } = gestoresProducto;

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;

    if (publishType === "video") {
      const file = files.find((f) => f.type.startsWith("video/"));
      if (file) setSingleVideoFile(file);
    } else if (publishType === "image") {
      const file = files.find((f) => f.type.startsWith("image/"));
      if (file) setSingleImageFile(file);
    } else if (publishType === "carousel") {
      const imgFiles = files.filter((f) => f.type.startsWith("image/"));
      setCarouselImageFiles([...carouselImageFiles, ...imgFiles]);
    } else if (publishType === "product") {
      const imgFiles = files.filter((f) => f.type.startsWith("image/"));
      setProductPhotoFiles([...productPhotoFiles, ...imgFiles]);
    }
  };

  const publishScope = { currentUser, onSuccess, title, description, taggedProductId, setIsLoading, setErrorMessage, setSuccessMessage, prodDescription, prodName, prodPrice, prodQuantity, newColorName, prodVariants, colorImageFiles, newColorFile, productPhotoFiles, productVideoFile, prodVariantList, prodShippingOptions, newShipLabel, newShipOrigin, newShipPrice, newShipTime, prodShippingCapital, prodShippingProvince, prodFreeShipping, singleVideoFile, videoCoverFile, singleImageFile, carouselImageFiles, validateFileExtension, uploadFileToGCS, uploadFilesSequentially, generateVideoThumbnail, apiFetch,  publishType, showBannerSection, bannerLabel, bannerTitle, bannerDescription, bannerLink, bannerEnabled, setBannerLabel, setBannerTitle, setBannerDescription, setBannerLink, setBannerEnabled, bannerImageFile, setBannerImageFile, bannerImagePreview, setBannerImagePreview, errorMessage, successMessage, handleSaveBanner, bannerSaving, videoInputRef, singleVideoFile, setSingleVideoFile, videoCoverFile, setVideoCoverFile, videoCoverInputRef, imageInputRef, singleImageFile, setSingleImageFile, carouselInputRef, carouselImageFiles, setCarouselImageFiles, prodPhotosRef, productPhotoFiles, setProductPhotoFiles, prodVideoRef, productVideoFile, setProductVideoFile, newColorImageInputRef, existingColorImageInputRef, newColorName, newColorFile, setNewColorFile, colorImageFiles, colorImagePreviews, editingColorTarget, setEditingColorTarget };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-display font-extrabold text-sm text-slate-900">Crear Nueva Publicación</h2>
            <p className="text-[10px] text-slate-500 font-medium">Comparte contenido interactivo o vende productos</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
          <span className="text-[10px] text-slate-600 font-mono font-bold mr-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">GCS & MongoDB</span>
        </div>
      </div>

          <Banner scope={publishScope} />
      {!showBannerSection && (
      <>
      {/* Tabs / Content types selector */}
      <div className="grid grid-cols-5 border-b border-slate-100 p-2 gap-1 bg-slate-50/20">
        <button
          type="button"
          onClick={() => { setPublishType("video"); setErrorMessage(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold font-sans transition-all cursor-pointer ${
            publishType === "video" 
              ? "bg-slate-950 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Reel</span>
        </button>

        <button
          type="button"
          onClick={() => { setPublishType("image"); setErrorMessage(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold font-sans transition-all cursor-pointer ${
            publishType === "image" 
              ? "bg-slate-950 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Imagen</span>
        </button>

        <button
          type="button"
          onClick={() => { setPublishType("carousel"); setErrorMessage(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold font-sans transition-all cursor-pointer ${
            publishType === "carousel" 
              ? "bg-slate-950 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Carrusel</span>
        </button>

        <button
          type="button"
          onClick={() => { setPublishType("product"); setErrorMessage(null); }}
          className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold font-sans transition-all cursor-pointer ${
            publishType === "product" 
              ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/10" 
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Vender</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBannerSection((value) => !value)}
          aria-pressed={showBannerSection}
          className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold font-sans transition-all cursor-pointer ${
            showBannerSection ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-600 hover:bg-amber-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Banner</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Alerts */}
        {errorMessage && (
          <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="font-sans font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="font-sans font-medium">{successMessage}</div>
          </div>
        )}

        {/* Media Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
            isDragging 
              ? "border-amber-500 bg-amber-50/20" 
              : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
          }`}
        >
          <VideoForm scope={publishScope} />

          <Imagen scope={publishScope} />

          <Carrusel scope={publishScope} />

          <Vender scope={publishScope} />
        </div>

        {/* Form Inputs based on Publish Type */}
        {publishType !== "product" ? (
          /* REGULAR PUBLICATIONS (Video/Image/Carousel) */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título de la publicación</label>
              <input
                type="text"
                placeholder="Dale un título atractivo..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Descripción / Caption</label>
                <span className={`text-[10px] font-mono font-bold ${description.length >= 500 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {description.length} / 500 caracteres
                </span>
              </div>
              <textarea
                placeholder="Escribe una breve descripción (máximo 500 caracteres)..."
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={2}
                className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Atención: Este campo tiene un límite estricto de máximo 500 caracteres.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Tag className="w-3 h-3 text-slate-500" />
                <span>Etiquetar un Producto de mi Tienda (Opcional)</span>
              </label>
              <select
                value={taggedProductId}
                onChange={(e) => setTaggedProductId(e.target.value)}
                className="w-full text-xs font-sans p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-400 font-medium"
              >
                <option value="">-- No etiquetar producto --</option>
                {userProducts.map((p, index) => (
                  <option key={`${p.id}-${index}`} value={p.id}>
                    {p.name} - ${p.price}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* PRODUCT SALE MODE */
          <div className="space-y-4">
            <DatosProducto scope={publishScope} />
            <EnviosProducto scope={publishScope} />
            <VariantesProducto scope={publishScope} />
          </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl text-xs font-bold text-slate-950 transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              publishType === "product"
                ? "bg-amber-500 hover:bg-amber-400"
                : "bg-amber-500 hover:bg-amber-400"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>
                  {publishType === "video" || (publishType === "product" && productVideoFile)
                    ? "Transcodificando a stream HLS (.m3u8)..."
                    : "Publicando en GCS..."}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Publicar Ahora</span>
              </>
            )}
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
}

export { PublishView as Publicar, PublishView as PublicarPerfilView };
