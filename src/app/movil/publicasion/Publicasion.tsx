import React, { useRef, useState } from "react";
import { User, Product, ProductVariantItem } from "../../../types";
import { androidApiFetch } from "../api";
import type { AndroidPublishViewProps, PublishType, ProductVariantGroup, ProductVariantsProps } from "./TiposPublicasion";
import EncabezadoPublicasion from "./EncabezadoPublicasion";
import AlertasPublicasion from "./AlertasPublicasion";
import FormularioVideo from "./FormularioVideo";
import FormularioProducto from "./FormularioProducto";
import PiePublicasion from "./PiePublicasion";

export default function AndroidPublishView({ currentUser, onBack, onSuccess, userProducts }: AndroidPublishViewProps) {
  const [type, setType] = useState<PublishType>("video");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Video state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [productId, setProductId] = useState("");
  const [aspect, setAspect] = useState<"vertical" | "horizontal" | "square">("vertical");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Product state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [shippingCapital, setShippingCapital] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [stock, setStock] = useState("10");
  const [category, setCategory] = useState("Ropa Femenina");
  const [productDescription, setProductDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Product variants & color images state
  const [prodVariants, setProdVariants] = useState<{ name: string; options: string[] }[]>([
    { name: "Talla", options: ["S", "M", "L"] },
    { name: "Color", options: ["Negro", "Blanco"] }
  ]);
  const [prodVariantList, setProdVariantList] = useState<ProductVariantItem[]>([]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorFile, setNewColorFile] = useState<File | null>(null);
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, File>>({});
  const [colorImagePreviews, setColorImagePreviews] = useState<Record<string, string>>({});
  const [editingColorTarget, setEditingColorTarget] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const newColorImageInputRef = useRef<HTMLInputElement>(null);
  const existingColorImageInputRef = useRef<HTMLInputElement>(null);

  const handleAddColorVariant = () => {
    const trimmedColor = newColorName.trim();
    if (!trimmedColor) return;
    const colorKey = trimmedColor.toLowerCase();

    setProdVariants((prev) => {
      const colorIdx = prev.findIndex((v) => v.name.trim().toLowerCase() === "color");
      if (colorIdx >= 0) {
        const existingOpts = prev[colorIdx].options;
        if (existingOpts.some((o) => o.trim().toLowerCase() === colorKey)) return prev;
        const updated = [...prev];
        updated[colorIdx] = { ...updated[colorIdx], options: [...existingOpts, trimmedColor] };
        return updated;
      }
      return [...prev, { name: "Color", options: [trimmedColor] }];
    });

    if (newColorFile) {
      const previewUrl = URL.createObjectURL(newColorFile);
      setColorImageFiles((prev) => ({ ...prev, [colorKey]: newColorFile }));
      setColorImagePreviews((prev) => ({ ...prev, [colorKey]: previewUrl }));
      setProdVariantList((prev) => [
        ...prev.filter((item) => (item.color || item.name || "").trim().toLowerCase() !== colorKey),
        {
          id: `var_color_${Date.now()}`,
          name: trimmedColor,
          color: trimmedColor,
          price: parseFloat(String(price).replace(",", ".")) || 0,
          imageUrl: previewUrl,
        },
      ]);
    }

    setNewColorName("");
    setNewColorFile(null);
    if (newColorImageInputRef.current) newColorImageInputRef.current.value = "";
  };

  const handleAssignColorImage = (colorName: string, file: File) => {
    const colorKey = colorName.trim().toLowerCase();
    const previewUrl = URL.createObjectURL(file);
    setColorImageFiles((prev) => ({ ...prev, [colorKey]: file }));
    setColorImagePreviews((prev) => ({ ...prev, [colorKey]: previewUrl }));
    setProdVariantList((prev) => [
      ...prev.filter((item) => (item.color || item.name || "").trim().toLowerCase() !== colorKey),
      {
        id: `var_color_${Date.now()}`,
        name: colorName.trim(),
        color: colorName.trim(),
        price: parseFloat(String(price).replace(",", ".")) || 0,
        imageUrl: previewUrl,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setProdVariants(prodVariants.filter((_, i) => i !== index));
  };

  const handleRemoveVariantOption = (variantIndex: number, optionToRemove: string) => {
    const targetVar = prodVariants[variantIndex];
    if (!targetVar) return;
    if (targetVar.name.trim().toLowerCase().includes("color")) {
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
      setProdVariants(prodVariants.map((v, idx) => (idx === variantIndex ? { ...v, options: nextOptions } : v)));
    }
  };

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
      const merged = Array.from(new Set([...prodVariants[existingIdx].options, ...options]));
      setProdVariants(prodVariants.map((v, i) => (i === existingIdx ? { ...v, options: merged } : v)));
    } else {
      setProdVariants([...prodVariants, { name: varNameClean, options }]);
    }
    setNewVarName("");
    setNewVarValue("");
  };

  const selectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideo(f);
    setError(null);
    const u = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = u;
    v.onloadedmetadata = () => {
      const r = (v.videoWidth || 1) / (v.videoHeight || 1);
      setAspect(r < 0.85 ? "vertical" : r > 1.18 ? "horizontal" : "square");
      URL.revokeObjectURL(u);
    };
  };

  const upload = async (file: File) => {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ts|m3u8)$/i.test(file.name);

    // 1. Direct GCS Signed URL upload for images (videos must go through backend FFmpeg HLS/faststart pipeline)
    if (!isVideo) {
      try {
        const folder = "publicaciones";
        const mime = file.type || "image/jpeg";
        const signedRes = await fetch(
          `/api/v1/media/upload-url?folder=${folder}&file_type=${encodeURIComponent(mime)}&file_name=${encodeURIComponent(file.name)}`
        );
        if (signedRes.ok) {
          const { upload_url, public_url } = await signedRes.json();
          if (upload_url && public_url) {
            const putRes = await fetch(upload_url, {
              method: "PUT",
              headers: { "Content-Type": mime },
              body: file,
            });
            if (putRes.ok) {
              console.log("⚡ [Android Direct GCS] Imagen subida vía Signed URL:", public_url);
              return { success: true, url: public_url };
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ [Android Direct GCS] Falló subida directa, usando pipeline del servidor:", e);
      }
    }

    const createFormData = () => {
      const fd = new FormData();
      fd.append("file", file, file.name);
      fd.append("platform", "android");
      fd.append("creatorId", currentUser.originalId || currentUser.id);
      fd.append("creatorUsername", currentUser.username);
      return fd;
    };

    let r: Response;
    try {
      r = await androidApiFetch("/upload", { method: "POST", body: createFormData() });
    } catch {
      r = await fetch("/api/upload", { method: "POST", body: createFormData() });
    }

    let text = await r.text();
    if (!r.ok || !text.trim().startsWith("{")) {
      try {
        const altR = await fetch("/api/upload", { method: "POST", body: createFormData() });
        if (altR.ok) {
          const altText = await altR.text();
          if (altText.trim().startsWith("{")) {
            r = altR;
            text = altText;
          }
        }
      } catch {}
    }

    if (!r.ok) {
      if (/^<!doctype html/i.test(text)) {
        throw new Error(`El backend rechazó la subida (HTTP ${r.status}). Por favor reintenta.`);
      }
      let msg = text;
      try {
        const parsed = JSON.parse(text);
        msg = parsed?.error || parsed?.message || msg;
      } catch {}
      throw new Error(msg || `Error de subida HTTP ${r.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("El backend devolvió JSON inválido al subir el archivo.");
    }
  };

  const publishVideo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!video) return setError("Debes seleccionar un video para tu Reel.");
    if (!title.trim()) return setError("Por favor ingresa un título para el video.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const d = await upload(video);
      const url = d.url || d.videoUrl;
      if (!url) throw new Error("El backend no devolvió la URL del video.");

      const r = await androidApiFetch("/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type: "video",
          videoUrl: url,
          hlsUrl: d.hlsUrl,
          thumbnailUrl: d.thumbnailUrl,
          media: [{
            type: "video",
            url: d.hlsUrl || url,
            hlsUrl: d.hlsUrl,
            thumbnailUrl: d.thumbnailUrl || undefined,
          }],
          creatorId: currentUser.originalId || currentUser.id,
          creatorUsername: currentUser.username,
          creatorName: currentUser.name,
          creatorAvatar: currentUser.avatar,
          taggedProductId: productId || undefined,
          aspectRatio: aspect,
        }),
      });

      if (!r.ok) throw new Error(`No se pudo registrar la publicación (HTTP ${r.status}).`);
      setSuccess("¡Video publicado exitosamente!");
      setTimeout(onSuccess, 800);
    } catch (e: any) {
      setError(e?.message || "Error al publicar el video.");
    } finally {
      setLoading(false);
    }
  };

  const publishProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !price.trim()) return setError("Nombre y precio son obligatorios.");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const effectiveVariants = [...prodVariants.map((v) => ({ ...v, options: [...v.options] }))];
      const effectiveColorFiles: Record<string, File> = { ...colorImageFiles };
      if (newColorName.trim()) {
        const pendingColor = newColorName.trim();
        const pendingKey = pendingColor.toLowerCase();
        const cIdx = effectiveVariants.findIndex((v) => v.name.trim().toLowerCase() === "color");
        if (cIdx >= 0) {
          if (!effectiveVariants[cIdx].options.some((o) => o.trim().toLowerCase() === pendingKey)) {
            effectiveVariants[cIdx].options.push(pendingColor);
          }
        } else {
          effectiveVariants.push({ name: "Color", options: [pendingColor] });
        }
        if (newColorFile) {
          effectiveColorFiles[pendingKey] = newColorFile;
        }
      }

      const uploadedColorUrlMap: Record<string, string> = {};
      for (const [colorKey, file] of Object.entries(effectiveColorFiles)) {
        const uploadedRes = await upload(file);
        if (uploadedRes?.url) {
          uploadedColorUrlMap[colorKey] = uploadedRes.url;
        }
      }

      let imageUrl = "";
      if (image) {
        imageUrl = (await upload(image)).url;
      } else if (Object.values(uploadedColorUrlMap).length > 0) {
        imageUrl = Object.values(uploadedColorUrlMap)[0];
      } else {
        imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
      }
      if (!imageUrl) throw new Error("El backend no devolvió la URL de la imagen.");

      const parsedPrice = parseFloat(String(price).replace(",", ".")) || 0;
      const finalVariantList: ProductVariantItem[] = [];
      const seenVariantKeys = new Set<string>();
      const colorGroup = effectiveVariants.find((v) => v.name.trim().toLowerCase().includes("color"));
      const colorOptions = colorGroup ? colorGroup.options : [];

      colorOptions.forEach((opt, idx) => {
        const key = opt.trim().toLowerCase();
        const uploadedUrl = uploadedColorUrlMap[key];
        const existingItem = prodVariantList.find((item) => (item.color || item.name || "").trim().toLowerCase() === key);
        const resolvedImageUrl =
          uploadedUrl || (existingItem?.imageUrl && !existingItem.imageUrl.startsWith("blob:") ? existingItem.imageUrl : undefined);
        if (resolvedImageUrl) {
          seenVariantKeys.add(key);
          finalVariantList.push({
            id: existingItem?.id || `var_color_${Date.now()}_${idx}`,
            name: opt.trim(),
            color: opt.trim(),
            price: parsedPrice,
            imageUrl: resolvedImageUrl,
          });
        }
      });

      const allImages = Array.from(new Set([imageUrl, ...Object.values(uploadedColorUrlMap)].filter(Boolean)));

      const parsedCapital = Math.max(0, parseFloat(String(shippingCapital).replace(",", ".")) || 0);
      const parsedProvince = Math.max(0, parseFloat(String(shippingProvince).replace(",", ".")) || 0);
      const isFreeShipping = Boolean(freeShipping);
      const parsedStock = parseInt(String(stock), 10);
      const effectiveStock = !Number.isNaN(parsedStock) && parsedStock >= 0 ? parsedStock : 10;

      const r = await androidApiFetch("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: parsedPrice,
          shippingCost: isFreeShipping && parsedCapital === 0 ? 0 : parsedCapital,
          shippingCapital: parsedCapital,
          shippingProvince: parsedProvince,
          freeShipping: isFreeShipping,
          stock: effectiveStock,
          description: productDescription.trim(),
          category,
          imageUrl,
          images: allImages,
          variants: effectiveVariants,
          variantList: finalVariantList,
          sellerId: currentUser.originalId || currentUser.id,
          sellerName: currentUser.name,
          sellerUsername: currentUser.username,
          inStock: effectiveStock > 0,
        }),
      });

      if (!r.ok) throw new Error(`No se pudo crear el producto (HTTP ${r.status}).`);
      setSuccess("¡Producto publicado exitosamente!");
      setTimeout(onSuccess, 800);
    } catch (e: any) {
      setError(e?.message || "Error al publicar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const variantProps: ProductVariantsProps = {
    prodVariants, newColorName, setNewColorName, newColorFile, setNewColorFile,
    colorImageFiles, setColorImageFiles, colorImagePreviews, setColorImagePreviews,
    prodVariantList, setProdVariantList, editingColorTarget, setEditingColorTarget,
    newVarName, setNewVarName, newVarValue, setNewVarValue,
    newColorImageInputRef, existingColorImageInputRef, price,
    handleAddColorVariant, handleAssignColorImage, handleRemoveVariant,
    handleRemoveVariantOption, handleAddVariant,
  };
  const productFormProps = {
    image, setImage, imageInputRef, name, setName, price, setPrice, stock, setStock,
    shippingCapital, setShippingCapital, shippingProvince, setShippingProvince,
    freeShipping, setFreeShipping, category, setCategory, productDescription,
    setProductDescription, variantProps,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col h-full w-full overflow-hidden select-none">
      <EncabezadoPublicasion onBack={onBack} type={type} setType={setType} setError={setError} />
      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 touch-pan-y" style={{ WebkitOverflowScrolling: "touch", paddingBottom: "10rem" }}>
        <AlertasPublicasion error={error} success={success} />
        {type === "video" && (
          <FormularioVideo video={video} setVideo={setVideo} videoInputRef={videoInputRef} aspect={aspect} selectVideo={selectVideo} title={title} setTitle={setTitle} description={description} setDescription={setDescription} productId={productId} setProductId={setProductId} userProducts={userProducts} />
        )}
        {type === "product" && <FormularioProducto {...productFormProps} />}
      </main>
      <PiePublicasion type={type} loading={loading} publishVideo={() => publishVideo()} publishProduct={() => publishProduct()} />
    </div>
  );
}
