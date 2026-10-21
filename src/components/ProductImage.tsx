import Image from "next/image";

// Foto de producto sobre fondo gris, al estilo de estudio. Las fotos tienen fondo blanco:
// mix-blend-multiply lo funde con el gris para que el envase "flote" sobre el fondo.
export function ProductImage({ src, alt, priority, className = "" }: { src: string | null; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-fog ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-[8%] mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-subtle">{alt}</div>
      )}
    </div>
  );
}
