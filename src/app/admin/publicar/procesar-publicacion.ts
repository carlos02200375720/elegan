import React from "react";
import { ProductVariantItem, ProductShippingOption } from "../../../types";

export async function procesarPublicacion(e: React.FormEvent, scope: any) {
  const { currentUser, onSuccess, publishType, description, prodDescription, setErrorMessage, setSuccessMessage, setIsLoading, singleVideoFile, validateFileExtension, uploadFileToGCS, videoCoverFile, generateVideoThumbnail, apiFetch, taggedProductId, singleImageFile, carouselImageFiles, uploadFilesSequentially, prodName, prodPrice, prodQuantity, newColorName, prodVariants, colorImageFiles, newColorFile, productPhotoFiles, productVideoFile, prodVariantList, prodShippingOptions, newShipLabel, newShipOrigin, newShipPrice, newShipTime, prodShippingCapital, prodShippingProvince, prodFreeShipping } = scope;

    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate authenticated user by stable account ID, not username.
    if (
      !currentUser?.id ||
      currentUser.isGuest === true ||
      currentUser.id === "guest" ||
      currentUser.id === "current_user" ||
      currentUser.id.startsWith("guest_")
    ) {
      setErrorMessage("Debes iniciar sesión con una cuenta para poder publicar contenido o registrar productos.");
      return;
    }

    // Validate 500 character max limit
    if (publishType !== "product" && description.length > 500) {
      setErrorMessage("La descripción excede el límite permitido de máximo 500 caracteres.");
      return;
    }
    if (publishType === "product" && prodDescription.length > 500) {
      setErrorMessage("La descripción del producto excede el límite permitido de máximo 500 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      if (publishType === "video") {
        if (!singleVideoFile) {
          throw new Error("Por favor, selecciona un video para tu publicación.");
        }
        if (!validateFileExtension(singleVideoFile, ["mp4", "mov", "m4v", "webm", "avi", "mkv", "3gp", "ts", "m3u8"])) {
          throw new Error("El archivo de video debe tener un formato válido (.mp4, .mov, .m4v, .webm, etc.)");
        }

        // 1. Upload video
        const { url: videoUrl, hlsUrl } = await uploadFileToGCS(singleVideoFile);

        // Determine real cover thumbnail: custom image or auto-extracted video frame
        let thumbnailUrl = "";
        if (videoCoverFile) {
          try {
            const coverRes = await uploadFileToGCS(videoCoverFile);
            thumbnailUrl = coverRes.url;
          } catch (coverErr) {
            console.error("Error subiendo portada personalizada:", coverErr);
          }
        }

        if (!thumbnailUrl) {
          try {
            const frameBlob = await generateVideoThumbnail(singleVideoFile);
            const frameFile = new File([frameBlob], `thumb_${Date.now()}.jpg`, { type: "image/jpeg" });
            const frameRes = await uploadFileToGCS(frameFile);
            thumbnailUrl = frameRes.url;
          } catch (frameErr) {
            console.warn("No se pudo extraer miniatura del video:", frameErr);
            thumbnailUrl = videoUrl;
          }
        }

        // 2. Register Reel
        const response = await apiFetch("/api/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "video",
            videoUrl,
            hlsUrl,
            thumbnailUrl,
            media: [{
              type: "video",
              url: hlsUrl || videoUrl,
              hlsUrl,
              thumbnailUrl: thumbnailUrl || undefined,
            }],
            description,
            creatorId: currentUser.originalId || currentUser.id,
            creatorOriginalId: currentUser.originalId || "",
            creatorUsername: currentUser.username,
            creatorName: currentUser.name,
            creatorAvatar: currentUser.avatar,
            productId: taggedProductId || undefined
          }),
        });

        let resData: any = null;
        const resText = await response.text();
        try {
          resData = JSON.parse(resText);
        } catch {}

        if (!response.ok || (resData && resData.success === false)) {
          throw new Error(resData?.error || resData?.message || "Error al guardar la publicación en el servidor");
        }

        setSuccessMessage("¡Tu video se ha procesado a stream HLS (.m3u8) y publicado con éxito!");
        setTimeout(() => {
          onSuccess();
        }, 1500);

      } else if (publishType === "image") {
        if (!singleImageFile) {
          throw new Error("Por favor, selecciona una imagen para tu publicación.");
        }
        if (!validateFileExtension(singleImageFile, ["png", "jpeg", "jpg", "webp"])) {
          throw new Error("La imagen debe tener una extensión válida (.png, .jpeg, .jpg, .webp)");
        }

        // 1. Upload image
        const { url: imageUrl } = await uploadFileToGCS(singleImageFile);

        // 2. Register Reel/Publication of type 'image'
        const response = await apiFetch("/api/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: "",
            thumbnailUrl: imageUrl,
            description,
            creatorId: currentUser.originalId || currentUser.id,
            creatorOriginalId: currentUser.originalId || "",
            creatorUsername: currentUser.username,
            creatorName: currentUser.name,
            creatorAvatar: currentUser.avatar,
            type: "image",
            images: [imageUrl],
            productId: taggedProductId || undefined
          }),
        });

        let resData: any = null;
        const resText = await response.text();
        try {
          resData = JSON.parse(resText);
        } catch {}

        if (!response.ok || (resData && resData.success === false)) {
          throw new Error(resData?.error || resData?.message || "Error al guardar la publicación en el servidor");
        }

        setSuccessMessage("¡Tu imagen se ha publicado con éxito!");
        setTimeout(() => {
          onSuccess();
        }, 1500);

      } else if (publishType === "carousel") {
        if (carouselImageFiles.length === 0) {
          throw new Error("Por favor, selecciona al menos una imagen para tu carrusel.");
        }
        
        // Validate extensions
        for (const file of carouselImageFiles) {
          if (!validateFileExtension(file, ["png", "jpeg", "jpg", "webp"])) {
            throw new Error(`El archivo ${file.name} no tiene una extensión válida (.png, .jpeg, .jpg, .webp)`);
          }
        }

        // 1. Upload one file at a time to avoid saturating the device and connection
        const uploadedImages = await uploadFilesSequentially(carouselImageFiles);
        const imageUrls = uploadedImages.map(img => img.url);

        // 2. Register publication of type 'carousel'
        const response = await apiFetch("/api/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: "",
            thumbnailUrl: imageUrls[0],
            description,
            creatorId: currentUser.originalId || currentUser.id,
            creatorOriginalId: currentUser.originalId || "",
            creatorUsername: currentUser.username,
            creatorName: currentUser.name,
            creatorAvatar: currentUser.avatar,
            type: "carousel",
            images: imageUrls,
            productId: taggedProductId || undefined
          }),
        });

        let resData: any = null;
        const resText = await response.text();
        try {
          resData = JSON.parse(resText);
        } catch {}

        if (!response.ok || (resData && resData.success === false)) {
          throw new Error(resData?.error || resData?.message || "Error al guardar la publicación en el servidor");
        }

        setSuccessMessage("¡Tu carrusel se ha publicado con éxito!");
        setTimeout(() => {
          onSuccess();
        }, 1500);

      } else if (publishType === "product") {
        if (!prodName.trim() || !prodDescription.trim() || !prodPrice.trim() || !prodQuantity.trim()) {
          throw new Error("Por favor, completa los campos requeridos del producto.");
        }

        // Include any pending color in the input field if the user didn't click "+ Añadir Color" yet
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

        // Validate product image extensions for uploaded files
        for (const file of productPhotoFiles) {
          if (!validateFileExtension(file, ["png", "jpeg", "jpg", "webp"])) {
            throw new Error(`La foto ${file.name} no tiene una extensión válida (.png, .jpeg, .jpg, .webp)`);
          }
        }

        for (const [colorKey, file] of Object.entries(effectiveColorFiles)) {
          if (!validateFileExtension(file, ["png", "jpeg", "jpg", "webp"])) {
            throw new Error(`La imagen del color "${colorKey}" (${file.name}) no tiene una extensión válida (.png, .jpeg, .jpg, .webp)`);
          }
        }

        // Validate product video extension if exists
        if (productVideoFile && !validateFileExtension(productVideoFile, ["mp4", "mov", "m4v", "webm", "avi", "mkv", "3gp", "ts", "m3u8"])) {
          throw new Error("El video del producto debe tener una extensión válida");
        }

        // 1. Upload new product photos
        const uploadedPhotoObjs = await uploadFilesSequentially(productPhotoFiles);
        const photoUrls = uploadedPhotoObjs.map(p => p.url);

        // 1.b Upload color variant images to GCS
        const uploadedColorUrlMap: Record<string, string> = {};
        for (const [colorKey, file] of Object.entries(effectiveColorFiles)) {
          const uploadedColorRes = await uploadFileToGCS(file);
          uploadedColorUrlMap[colorKey] = uploadedColorRes.url;
        }

        // Build final variantList with real uploaded image URLs for colors
        const finalVariantList: ProductVariantItem[] = [];
        const seenVariantKeys = new Set<string>();

        const colorGroup = effectiveVariants.find((v) => v.name.trim().toLowerCase().includes("color"));
        const colorOptions = colorGroup ? colorGroup.options : [];

        colorOptions.forEach((opt, idx) => {
          const key = opt.trim().toLowerCase();
          const uploadedUrl = uploadedColorUrlMap[key];
          const existingItem = prodVariantList.find(
            (item) => (item.color || item.name || "").trim().toLowerCase() === key
          );
          const resolvedImageUrl =
            uploadedUrl ||
            (existingItem?.imageUrl && !existingItem.imageUrl.startsWith("blob:") ? existingItem.imageUrl : undefined);

          if (resolvedImageUrl) {
            seenVariantKeys.add(key);
            finalVariantList.push({
              id: existingItem?.id || `var_color_${Date.now()}_${idx}`,
              name: opt.trim(),
              color: opt.trim(),
              price: parseFloat(prodPrice) || 0,
              imageUrl: resolvedImageUrl,
            });
          }
        });

        // Also keep any other non-blob items from prodVariantList
        prodVariantList.forEach((item, idx) => {
          const key = (item.color || item.name || "").trim().toLowerCase();
          if (!seenVariantKeys.has(key)) {
            const uploadedUrl = uploadedColorUrlMap[key];
            const resolvedImageUrl =
              uploadedUrl || (item.imageUrl && !item.imageUrl.startsWith("blob:") ? item.imageUrl : undefined);
            if (resolvedImageUrl) {
              seenVariantKeys.add(key);
              finalVariantList.push({
                ...item,
                id: item.id || `var_item_${Date.now()}_${idx}`,
                price: item.price || parseFloat(prodPrice) || 0,
                imageUrl: resolvedImageUrl,
              });
            }
          }
        });

        const colorPhotoUrls = Object.values(uploadedColorUrlMap).filter(Boolean);
        const allProductPhotos = Array.from(new Set([...photoUrls, ...colorPhotoUrls]));

        if (allProductPhotos.length === 0) {
          throw new Error("Por favor, selecciona al menos una foto para tu producto.");
        }

        // 2. Upload product video if present
        let videoUrl = "";
        if (productVideoFile) {
          const videoRes = await uploadFileToGCS(productVideoFile);
          videoUrl = videoRes.url;
        }

        // 3. Register Product
        const parsedCapital = Math.max(0, parseFloat(String(prodShippingCapital).replace(",", ".")) || 0);
        const parsedProvince = Math.max(0, parseFloat(String(prodShippingProvince).replace(",", ".")) || 0);

        // Build final manual shipping options list (include any pending typed shipping option if user didn't click "+ Añadir")
        const effectiveShippingOptions: ProductShippingOption[] = [...prodShippingOptions];
        if (newShipLabel.trim()) {
          effectiveShippingOptions.push({
            id: `ship_${Date.now()}_pending`,
            label: newShipLabel.trim(),
            origin: newShipOrigin.trim() || undefined,
            price: Math.max(0, parseFloat(String(newShipPrice).replace(",", ".")) || 0),
            deliveryTime: newShipTime.trim() || "5-10 días hábiles",
          });
        }

        // Also include Capital / Province if entered in quick fields and not already in effectiveShippingOptions
        if (parsedCapital > 0 && !effectiveShippingOptions.some((o) => o.label.toLowerCase().includes("capital"))) {
          effectiveShippingOptions.push({
            id: `ship_cap_${Date.now()}`,
            label: "Envío a la Capital",
            origin: "Capital",
            price: parsedCapital,
            deliveryTime: "1-3 días hábiles",
          });
        }
        if (parsedProvince > 0 && !effectiveShippingOptions.some((o) => o.label.toLowerCase().includes("provincia"))) {
          effectiveShippingOptions.push({
            id: `ship_prov_${Date.now()}`,
            label: "Envío a Provincia",
            origin: "Provincia",
            price: parsedProvince,
            deliveryTime: "3-5 días hábiles",
          });
        }
        if (prodFreeShipping && !effectiveShippingOptions.some((o) => o.price === 0)) {
          effectiveShippingOptions.push({
            id: `ship_free_${Date.now()}`,
            label: "Envío Gratis",
            origin: "Gratis",
            price: 0,
            deliveryTime: "1-5 días hábiles",
          });
        }

        const isFreeShipping = Boolean(prodFreeShipping) || effectiveShippingOptions.some((o) => o.price === 0);
        const primaryShippingCost =
          effectiveShippingOptions.length > 0
            ? effectiveShippingOptions[0].price
            : isFreeShipping && parsedCapital === 0
            ? 0
            : parsedCapital;

        const response = await apiFetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prodName,
            description: prodDescription,
            price: parseFloat(prodPrice),
            imageUrl: allProductPhotos[0],
            stock: Math.max(0, parseInt(prodQuantity, 10) || 0),
            sellerId: currentUser.originalId || currentUser.id,
            sellerOriginalId: currentUser.originalId || "",
            sellerUsername: currentUser.username,
            sellerName: currentUser.name,
            sellerAvatar: currentUser.avatar,
            shippingCost: primaryShippingCost,
            shippingCapital: parsedCapital,
            shippingProvince: parsedProvince,
            freeShipping: isFreeShipping,
            shippingOptions: effectiveShippingOptions,
            images: allProductPhotos,
            videos: videoUrl ? [videoUrl] : [],
            variants: effectiveVariants,
            variantList: finalVariantList,
            category: prodCategory
          }),
        });

        let resData: any = null;
        const resText = await response.text();
        try {
          resData = JSON.parse(resText);
        } catch {}

        if (!response.ok || (resData && resData.success === false)) {
          throw new Error(resData?.error || resData?.message || "Error al guardar el producto en el servidor");
        }

        setSuccessMessage("¡Tu producto se ha registrado para la venta con éxito!");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error publishing:", err);
      let msg = err.message || "Error al realizar la publicación";
      if (typeof msg === "string" && (msg.includes("signal is aborted") || msg.includes("aborted"))) {
        msg = "La subida tardó más tiempo del esperado por tu velocidad de conexión. Por favor, inténtalo nuevamente.";
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }

}
