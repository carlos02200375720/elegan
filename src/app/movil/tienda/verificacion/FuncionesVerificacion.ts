import { AndroidCheckoutForm, BankAccountInfo } from "./TiposVerificacion";

export const ACCOUNT_HOLDER = "Carlos David Garcia Batista";

export const OFFICIAL_BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    id: "popular",
    bankName: "1. Banco Popular",
    type: "Ahorros",
    accountNumber: "824-102948-2",
    accountNumberClean: "8241029482",
    badgeColor: { bg: "bg-blue-100", text: "text-blue-800" },
  },
  {
    id: "banreservas",
    bankName: "2. Banreservas",
    type: "Ahorros",
    accountNumber: "960-239104-5",
    accountNumberClean: "9602391045",
    badgeColor: { bg: "bg-emerald-100", text: "text-emerald-800" },
  },
  {
    id: "bhd",
    bankName: "3. Banco BHD",
    type: "Ahorros",
    accountNumber: "045-819203-1",
    accountNumberClean: "0458192031",
    badgeColor: { bg: "bg-purple-100", text: "text-purple-800" },
  },
];

export function validateCheckoutForm(form: AndroidCheckoutForm): { isValid: boolean; error?: string } {
  if (
    !form.fullName.trim() ||
    !form.email.trim() ||
    !form.phone.trim() ||
    !form.shippingAddress.trim() ||
    !form.city?.trim() ||
    !form.country.trim() ||
    !form.postalCode.trim()
  ) {
    return {
      isValid: false,
      error: "Completa todos tus datos de contacto y dirección antes de continuar.",
    };
  }
  return { isValid: true };
}

export function compressReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Por favor selecciona una imagen válida del comprobante de pago."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo leer la imagen seleccionada."));
        return;
      }
      const rawDataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
            return;
          }
        }
        resolve(rawDataUrl);
      };
      img.onerror = () => {
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
