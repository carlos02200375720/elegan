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

  // File extensions checker helper
  const validateFileExtension = (file: File, allowedExtensions: string[]): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
  };

  // Upload file helper
  const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      // @ts-ignore
      video.webkitPlaysInline = true;
      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;

      let handled = false;
      const cleanup = () => {
        if (handled) return;
        handled = true;
        clearTimeout(timer);
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {}
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      };

      const timer = setTimeout(() => {
        if (!handled) {
          cleanup();
          // Generate a fallback dark canvas thumbnail if video decoding times out
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#0f172a";
              ctx.fillRect(0, 0, 640, 360);
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Timeout al generar portada del video"));
              }, "image/jpeg", 0.85);
              return;
            }
          } catch (e) {}
          reject(new Error("Timeout al generar portada del video"));
        }
      }, 5000);

      const captureFrame = () => {
        if (handled) return;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              cleanup();
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("No se pudo extraer la portada del video"));
              }
            }, "image/jpeg", 0.85);
          } else {
            cleanup();
            reject(new Error("No se pudo crear contexto del canvas"));
          }
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      };

      video.onseeked = captureFrame;

      video.onerror = (err) => {
        cleanup();
        reject(err);
      };

      video.load();
    });
  };

  const uploadFileToGCS = async (file: File): Promise<{ url: string; hlsUrl?: string }> => {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ts|m3u8)$/i.test(file.name);
    const fileToUpload = file;

    // 1. PATRÓN DE SUBIDA DIRECTA A GOOGLE CLOUD STORAGE (Signed URLs) PARA IMÁGENES
    // Los videos pasan por el pipeline del backend para segmentación HLS / faststart (moov al inicio)
    if (!isVideo) {
      try {
        const folder = "publicaciones";
        const mime = fileToUpload.type || "image/jpeg";
        const signedUrlRes = await fetch(
          getApiUrl(`/api/v1/media/upload-url?folder=${folder}&file_type=${encodeURIComponent(mime)}&file_name=${encodeURIComponent(fileToUpload.name)}`)
        );

        if (signedUrlRes.ok) {
          const { upload_url, public_url } = await signedUrlRes.json();
          if (upload_url && public_url) {
            console.log(`⚡ [Direct GCS] Subiendo ${fileToUpload.name} directo a Google Cloud Storage...`);
            const putRes = await fetch(upload_url, {
              method: "PUT",
              headers: {
                "Content-Type": mime,
              },
              body: fileToUpload,
            });

            if (putRes.ok) {
              console.log(`✅ [Direct GCS] Subida directa exitosa a GCS: ${public_url}`);
              return { url: public_url };
            } else {
              console.warn(`⚠️ [Direct GCS] PUT directo a GCS retornó HTTP ${putRes.status}. Usando fallback vía servidor.`);
            }
          }
        }
      } catch (directErr) {
        console.warn("⚠️ [Direct GCS] Subida directa no disponible o bloqueada por CORS en navegador. Usando fallback al servidor:", directErr);
      }
    }

    const createFormData = () => {
      const fd = new FormData();
      fd.append("file", fileToUpload, fileToUpload.name);
      fd.append("title", fileToUpload.name);
      fd.append("description", "");
      fd.append("creatorId", currentUser.originalId || currentUser.id);
      fd.append("creatorOriginalId", currentUser.originalId || "");
      fd.append("creatorUsername", currentUser.username);
      return fd;
    };

    // Provide 5 minutes (300,000ms) for videos and 2 minutes for photos
    const timeoutMs = isVideo ? 300000 : 120000;
    let response: Response;
    try {
      response = await apiFetch("/api/upload", {
        method: "POST",
        body: createFormData(),
      }, timeoutMs);
    } catch (primaryErr: any) {
      console.warn("⚠️ [PublishView] Fallo inicial con apiFetch(/api/upload), intentando fetch relativo directo...", primaryErr);
      // Direct relative fallback if primary fetch failed
      try {
        response = await fetch("/api/upload", {
          method: "POST",
          body: createFormData(),
        });
      } catch (localErr) {
        try {
          response = await fetch("/api/android/upload", {
            method: "POST",
            body: createFormData(),
          });
        } catch {
          throw new Error(`No se pudo conectar con el servidor de subida: ${primaryErr?.message || "error de red"}`);
        }
      }
    }

    let rawText = await response.text();

    // If the server returned 5xx or HTML, attempt direct local fallback
    if (!response.ok || !rawText.trim().startsWith("{")) {
      try {
        const directRes = await fetch("/api/upload", {
          method: "POST",
          body: createFormData(),
        });
        const directText = await directRes.text();
        if (directRes.ok && directText.trim().startsWith("{")) {
          response = directRes;
          rawText = directText;
        }
      } catch {}
    }

    // Second fallback to android upload endpoint if standard failed
    if (!response.ok || !rawText.trim().startsWith("{")) {
      try {
        const androidRes = await fetch("/api/android/upload", {
          method: "POST",
          body: createFormData(),
        });
        const androidText = await androidRes.text();
        if (androidRes.ok && androidText.trim().startsWith("{")) {
          response = androidRes;
          rawText = androidText;
        }
      } catch {}
    }

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      if (/^<!doctype html/i.test(rawText.trim()) || rawText.includes("<html")) {
        throw new Error(`El servidor devolvió una página HTML en lugar de JSON (HTTP ${response.status}) al procesar ${fileToUpload.name}.`);
      }
      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status}) al subir ${fileToUpload.name}.`);
      }
      throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}) al subir ${fileToUpload.name}`);
    }

    if (!response.ok || !data?.success || !data?.url) {
      throw new Error(data?.error || data?.message || data?.details || `Error subiendo archivo: ${fileToUpload.name}`);
    }

    return { url: data.url, hlsUrl: data.hlsUrl };
  };

  const uploadFilesSequentially = async (files: File[]) => {
    const uploaded: { url: string; hlsUrl?: string }[] = [];
    for (const file of files) {
      uploaded.push(await uploadFileToGCS(file));
    }
    return uploaded;
  };

  // Add color variant with optional image
  const handleAddColorVariant = () => {
    const trimmedColor = newColorName.trim();
    if (!trimmedColor) return;
    const colorKey = trimmedColor.toLowerCase();

    // Update or create the "Color" group in prodVariants
    setProdVariants((prev) => {
      const colorIdx = prev.findIndex((v) => v.name.trim().toLowerCase() === "color");
      if (colorIdx >= 0) {
        const existingOpts = prev[colorIdx].options;
        const alreadyExists = existingOpts.some((o) => o.trim().toLowerCase() === colorKey);
        if (alreadyExists) return prev;
        const updated = [...prev];
        updated[colorIdx] = {
          ...updated[colorIdx],
          options: [...existingOpts, trimmedColor],
        };
        return updated;
      } else {
        return [...prev, { name: "Color", options: [trimmedColor] }];
      }
    });

    if (newColorFile) {
      const previewUrl = URL.createObjectURL(newColorFile);
      setColorImageFiles((prev) => ({ ...prev, [colorKey]: newColorFile }));
      setColorImagePreviews((prev) => ({ ...prev, [colorKey]: previewUrl }));
      setProdVariantList((prev) => {
        const filtered = prev.filter((item) => (item.color || item.name || "").trim().toLowerCase() !== colorKey);
        return [
          ...filtered,
          {
            id: `var_color_${Date.now()}`,
            name: trimmedColor,
            color: trimmedColor,
            price: parseFloat(prodPrice) || 0,
            imageUrl: previewUrl,
          },
        ];
      });
    }

    setNewColorName("");
    setNewColorFile(null);
    if (newColorImageInputRef.current) {
      newColorImageInputRef.current.value = "";
    }
  };

  // Attach or update image for an existing color option
  const handleAssignColorImage = (colorName: string, file: File) => {
    const colorKey = colorName.trim().toLowerCase();
    const previewUrl = URL.createObjectURL(file);
    setColorImageFiles((prev) => ({ ...prev, [colorKey]: file }));
    setColorImagePreviews((prev) => ({ ...prev, [colorKey]: previewUrl }));
    setProdVariantList((prev) => {
      const filtered = prev.filter((item) => (item.color || item.name || "").trim().toLowerCase() !== colorKey);
      return [
        ...filtered,
        {
          id: `var_color_${Date.now()}`,
          name: colorName.trim(),
          color: colorName.trim(),
          price: parseFloat(prodPrice) || 0,
          imageUrl: previewUrl,
        },
      ];
    });
  };

  // Remove a single option from a variant group
  const handleRemoveVariantOption = (variantIndex: number, optionToRemove: string) => {
    const targetVar = prodVariants[variantIndex];
    if (!targetVar) return;
    const isColorVar = targetVar.name.trim().toLowerCase().includes("color");
    if (isColorVar) {
      const colorKey = optionToRemove.trim().toLowerCase();
      setColorImageFiles((prev) => {
        const next = { ...prev };
        delete next[colorKey];
        return next;
      });
      setColorImagePreviews((prev) => {
        const next = { ...prev };
        delete next[colorKey];
        return next;
      });
      setProdVariantList((prev) =>
        prev.filter((item) => (item.color || item.name || "").trim().toLowerCase() !== colorKey)
      );
    }

    const nextOptions = targetVar.options.filter((o) => o !== optionToRemove);
    if (nextOptions.length === 0) {
      handleRemoveVariant(variantIndex);
    } else {
      setProdVariants(
        prodVariants.map((v, idx) => (idx === variantIndex ? { ...v, options: nextOptions } : v))
      );
    }
  };

  // Add custom variant
  const handleAddVariant = () => {
    if (!newVarName.trim() || !newVarValue.trim()) return;
    const options = newVarValue
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    
    if (options.length === 0) return;

    const varNameClean = newVarName.trim();
    const existingIdx = prodVariants.findIndex((v) => v.name.trim().toLowerCase() === varNameClean.toLowerCase());
    if (existingIdx >= 0) {
      const existingOpts = prodVariants[existingIdx].options;
      const merged = Array.from(new Set([...existingOpts, ...options]));
      setProdVariants(prodVariants.map((v, i) => (i === existingIdx ? { ...v, options: merged } : v)));
    } else {
      setProdVariants([...prodVariants, { name: varNameClean, options }]);
    }
    setNewVarName("");
    setNewVarValue("");
  };

  // Remove variant
  const handleRemoveVariant = (index: number) => {
    setProdVariants(prodVariants.filter((_, i) => i !== index));
  };

  // Manual Shipping Options Handlers
  const SHIPPING_PRESETS: { label: string; origin: string; defaultTime: string; defaultPrice?: string }[] = [
    { label: "Envío desde China 🇨🇳", origin: "China", defaultTime: "10-20 días hábiles" },
    { label: "Envío desde Estados Unidos 🇺🇸", origin: "Estados Unidos", defaultTime: "5-10 días hábiles" },
    { label: "Envío desde España / Europa 🇪🇸", origin: "España", defaultTime: "5-12 días hábiles" },
    { label: "Envío desde México 🇲🇽", origin: "México", defaultTime: "4-8 días hábiles" },
    { label: "Envío a la Capital 🏙️", origin: "Capital", defaultTime: "1-3 días hábiles" },
    { label: "Envío a Provincia 🚚", origin: "Provincia", defaultTime: "3-5 días hábiles" },
    { label: "Envío Express Internacional ⚡", origin: "Express", defaultTime: "3-6 días hábiles" },
    { label: "Envío Gratis 🎁", origin: "Gratis", defaultTime: "1-5 días hábiles", defaultPrice: "0" },
  ];

  const handleSelectShippingPreset = (preset: { label: string; origin: string; defaultTime: string; defaultPrice?: string }) => {
    setNewShipLabel(preset.label);
    setNewShipOrigin(preset.origin);
    setNewShipTime(preset.defaultTime);
    if (preset.defaultPrice !== undefined) {
      setNewShipPrice(preset.defaultPrice);
    }
  };

  const handleAddShippingOption = () => {
    const cleanLabel = newShipLabel.trim();
    if (!cleanLabel) return;
    const parsedPrice = Math.max(0, parseFloat(String(newShipPrice).replace(",", ".")) || 0);
    const cleanTime = newShipTime.trim() || "5-10 días hábiles";
    const cleanOrigin = newShipOrigin.trim();

    setProdShippingOptions((prev) => [
      ...prev,
      {
        id: `ship_${Date.now()}_${prev.length}`,
        label: cleanLabel,
        origin: cleanOrigin || undefined,
        price: parsedPrice,
        deliveryTime: cleanTime,
      },
    ]);
    setNewShipLabel("");
    setNewShipOrigin("");
    setNewShipPrice("");
  };

  const handleUpdateShippingOption = (index: number, field: keyof ProductShippingOption, value: string | number) => {
    setProdShippingOptions((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "price") {
          return { ...item, price: Math.max(0, parseFloat(String(value).replace(",", ".")) || 0) };
        }
        return { ...item, [field]: String(value) };
      })
    );
  };

  const handleRemoveShippingOption = (index: number) => {
    setProdShippingOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => procesarPublicacion(e, publishScope);

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
