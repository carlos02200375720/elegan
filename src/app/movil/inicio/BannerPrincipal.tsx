import React from "react";
import type { MouseEvent } from "react";
import { getMediaUrl } from "../config";
import { navigateTo } from "../enrutador";

export interface BannerInicioData {
  label?: string;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
}

interface BannerPrincipalProps {
  banner: BannerInicioData;
  onNavigateToPath?: (path: string) => void;
}

export default function BannerPrincipal({ banner, onNavigateToPath }: BannerPrincipalProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!banner.link) {
      event.preventDefault();
      return;
    }

    try {
      const target = new URL(banner.link.trim(), window.location.origin);
      if (target.origin === window.location.origin) {
        event.preventDefault();
        const targetPath = `${target.pathname}${target.search}${target.hash}`;
        if (onNavigateToPath) onNavigateToPath(targetPath);
        else navigateTo(targetPath);
      }
    } catch {
      event.preventDefault();
    }
  };

  const descriptionCharacters = Array.from(banner.description || "");

  return (
    <section aria-label="Publicidad y promociones" className="w-full p-0">
      <a
        href={banner.link || undefined}
        onClick={handleClick}
        className={`relative block aspect-[4/3] w-full overflow-hidden rounded-none bg-gradient-to-r from-slate-950 via-slate-800 to-amber-700 shadow-sm ${banner.link ? "cursor-pointer" : "cursor-default"}`}
        aria-label={banner.title}
      >
        {banner.imageUrl && (
          <img src={getMediaUrl(banner.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        <div className="absolute inset-0 z-10 flex flex-col justify-center overflow-y-auto px-4 py-3">
          <span className="mb-1 w-fit rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
            {banner.label || "Promoción"}
          </span>
          <h2 className="max-w-full break-words text-base font-extrabold leading-tight text-white [overflow-wrap:anywhere]">{banner.title}</h2>
          {banner.description && (
            <p className="mt-1 w-full max-w-full whitespace-normal break-words text-[11px] leading-snug text-white/90 [overflow-wrap:anywhere]">
              {Array.from({ length: Math.ceil(descriptionCharacters.length / 30) }, (_, index) => (
                <React.Fragment key={index}>
                  {descriptionCharacters.slice(index * 30, (index + 1) * 30).join("")}
                  {index < Math.ceil(descriptionCharacters.length / 30) - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
      </a>
    </section>
  );
}
