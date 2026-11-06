export function crearUtilidadesSubida(currentUser: any, apiFetch: any, getApiUrl: any) {
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
      try {
        response = await fetch("/api/upload", {
          method: "POST",
          body: createFormData(),
        });
      } catch {
        throw new Error(`No se pudo conectar con el servidor de subida: ${primaryErr?.message || "error de red"}`);
      }
    }

    let rawText = await response.text();

    // Reintenta únicamente el endpoint general de subida; admin no depende del router móvil.
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


  return { validateFileExtension, generateVideoThumbnail, uploadFileToGCS, uploadFilesSequentially };
}
