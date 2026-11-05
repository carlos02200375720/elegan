import React from "react";
import type { Reel } from "../../../types";
import TarjetaContenido from "./TarjetaContenido";
import type { TarjetaContenidoProps } from "./TarjetaContenido";

interface SeccionVideosProps {
  reels: Reel[];
  tarjetaProps: Omit<TarjetaContenidoProps, "reelItem" | "reelIndex">;
}

export default function SeccionVideos({ reels, tarjetaProps }: SeccionVideosProps) {
  return (
    <>
      {reels.map((reelItem, reelIndex) => (
        <TarjetaContenido
          key={reelItem.id || reelIndex}
          reelItem={reelItem}
          reelIndex={reelIndex}
          {...tarjetaProps}
        />
      ))}
    </>
  );
}
