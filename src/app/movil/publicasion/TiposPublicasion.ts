import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import type { User, Product, ProductVariantItem } from "../../../types";

export interface AndroidPublishViewProps {
  currentUser: User;
  onBack: () => void;
  onSuccess: () => void;
  userProducts: Product[];
}
export type PublishType = "video" | "product";
export type ProductVariantGroup = { name: string; options: string[] };

export interface VideoFormProps {
  video: File | null;
  setVideo: Dispatch<SetStateAction<File | null>>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  aspect: "vertical" | "horizontal" | "square";
  selectVideo: (event: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  productId: string;
  setProductId: Dispatch<SetStateAction<string>>;
  userProducts: Product[];
}
export interface ProductVariantsProps {
  prodVariants: ProductVariantGroup[];
  newColorName: string;
  setNewColorName: Dispatch<SetStateAction<string>>;
  newColorFile: File | null;
  setNewColorFile: Dispatch<SetStateAction<File | null>>;
  colorImageFiles: Record<string, File>;
  setColorImageFiles: Dispatch<SetStateAction<Record<string, File>>>;
  colorImagePreviews: Record<string, string>;
  setColorImagePreviews: Dispatch<SetStateAction<Record<string, string>>>;
  prodVariantList: ProductVariantItem[];
  setProdVariantList: Dispatch<SetStateAction<ProductVariantItem[]>>;
  editingColorTarget: string | null;
  setEditingColorTarget: Dispatch<SetStateAction<string | null>>;
  newVarName: string;
  setNewVarName: Dispatch<SetStateAction<string>>;
  newVarValue: string;
  setNewVarValue: Dispatch<SetStateAction<string>>;
  newColorImageInputRef: RefObject<HTMLInputElement | null>;
  existingColorImageInputRef: RefObject<HTMLInputElement | null>;
  price: string;
  handleAddColorVariant: () => void;
  handleAssignColorImage: (colorName: string, file: File) => void;
  handleRemoveVariant: (index: number) => void;
  handleRemoveVariantOption: (variantIndex: number, option: string) => void;
  handleAddVariant: () => void;
}
export interface ProductFormProps {
  image: File | null;
  setImage: Dispatch<SetStateAction<File | null>>;
  imageInputRef: RefObject<HTMLInputElement | null>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  price: string;
  setPrice: Dispatch<SetStateAction<string>>;
  stock: string;
  setStock: Dispatch<SetStateAction<string>>;
  shippingCapital: string;
  setShippingCapital: Dispatch<SetStateAction<string>>;
  shippingProvince: string;
  setShippingProvince: Dispatch<SetStateAction<string>>;
  freeShipping: boolean;
  setFreeShipping: Dispatch<SetStateAction<boolean>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  productDescription: string;
  setProductDescription: Dispatch<SetStateAction<string>>;
  variantProps: ProductVariantsProps;
}
