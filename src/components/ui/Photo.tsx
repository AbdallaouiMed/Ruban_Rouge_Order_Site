import Image from "next/image";

/**
 * A photo that fills its (positioned) parent. Site files go through next/image (responsive sizes,
 * AVIF/WebP); images uploaded in the demo admin are small data URLs that cannot be optimised, so
 * they use a plain <img>. Decorative by default: pass `alt` when the picture carries meaning.
 *
 * `priority` is for the one image that is the page's Largest Contentful Paint: it is preloaded,
 * loaded eagerly and fetched at high priority (Next 16 replaced its own `priority` prop with these).
 */
export function Photo({ src, alt = "", sizes, priority = false, className = "" }: { src: string; alt?: string; sizes: string; priority?: boolean; className?: string }) {
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`absolute inset-0 size-full object-cover ${className}`} />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      {...(priority ? { preload: true, loading: "eager" as const, fetchPriority: "high" as const } : {})}
      className={`object-cover ${className}`}
    />
  );
}
