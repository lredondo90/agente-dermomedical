import Image from "next/image";

// Foto de producto sobre un fondo cálido degradado. Las fotos tienen fondo blanco:
// mix-blend-multiply lo funde con el fondo para que el envase "flote".
export function ProductImage({ src, alt, priority, className = "" }: { src: string | null; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#f6f4f0_0%,#ebe8e1_100%)] ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-[10%] mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-subtle">{alt}</div>
      )}
    </div>
  );
}
