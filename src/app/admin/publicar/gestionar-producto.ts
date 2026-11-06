import { ProductShippingOption } from "../../../types";

export function crearGestoresProducto(scope: any) {
  const { prodVariants, setProdVariants, newColorName, setNewColorName, newColorFile, setNewColorFile, newColorImageInputRef, setColorImageFiles, setColorImagePreviews, setProdVariantList, prodPrice, prodVariantList, setEditingColorTarget, newVarName, setNewVarName, newVarValue, setNewVarValue, newShipLabel, setNewShipLabel, newShipOrigin, setNewShipOrigin, newShipPrice, setNewShipPrice, newShipTime, setNewShipTime, setProdShippingOptions } = scope;
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
 

  return { handleAddColorVariant, handleAssignColorImage, handleRemoveVariantOption, handleAddVariant, handleRemoveVariant, SHIPPING_PRESETS, handleSelectShippingPreset, handleAddShippingOption, handleUpdateShippingOption, handleRemoveShippingOption };
}
