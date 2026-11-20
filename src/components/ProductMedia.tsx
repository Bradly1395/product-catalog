"use client";

import { useState } from "react";
import { ProductPlaceholder } from "./ProductPlaceholder";

interface ProductMediaProps {
  title: string;
  category: string;
  imagePath: string | null;
  variant?: "card" | "detail" | "thumbnail";
  className?: string;
}

export function ProductMedia({
  title,
  category,
  imagePath,
  variant = "card",
  className = "",
}: ProductMediaProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(imagePath) && failedSrc !== imagePath;

  if (!showImage || !imagePath) {
    return (
      <ProductPlaceholder
        title={title}
        category={category}
        variant={variant}
        className={`w-full h-full ${className}`}
      />
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-surface-muted ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePath}
        alt={title}
        loading={variant === "detail" ? "eager" : "lazy"}
        onError={() => setFailedSrc(imagePath)}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}
