"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface MapImageProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
}

export function MapImage({ src, width, height, alt, className }: MapImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      draggable={false}
      className={cn("pointer-events-none select-none", className)}
      style={{ width: "100%", height: "auto", display: "block" }}
      priority
    />
  );
}
