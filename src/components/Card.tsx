import Image from "next/image";
import Link from "next/link";

export type BadgeTone = "red" | "green" | "orange";

export interface CardProps {
  title: string;
  description?: string;
  subtitle?: string;
  meta?: string | string[];
  imageSrc: string;
  imageAlt?: string;
  price?: string | number;
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  className?: string;
  brandName?: string | null;
  brandLogoUrl?: string | null;
  size?: 'default' | 'small';
}

const toneToBg: Record<BadgeTone, string> = {
  red: "text-[--color-red]",
  green: "text-[--color-green]",
  orange: "text-[--color-orange]",
};

export default function Card({
  title,
  description,
  subtitle,
  meta,
  imageSrc,
  imageAlt = title,
  price,
  href,
  badge,
  className = "",
  brandName,
  brandLogoUrl,
  size = 'default',
}: CardProps) {
  const displayPrice =
    price === undefined ? undefined : typeof price === "number" ? `$${price.toFixed(2)}` : price;
  
  const isSmall = size === 'small';
  const paddingClass = isSmall ? 'p-2.5' : 'p-4';
  const titleClass = isSmall ? 'text-sm font-semibold leading-tight' : 'text-base font-semibold leading-snug';
  const priceClass = isSmall ? 'text-base font-bold' : 'text-2xl font-bold';
  const textClass = isSmall ? 'text-xs' : 'text-body';
  
  const content = (
    <article
      className={`group rounded-xl bg-light-100 ring-1 ring-light-300 transition-colors hover:ring-dark-500 ${className}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-light-200">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={isSmall ? "(min-width: 1280px) 200px, (min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw" : "(min-width: 1280px) 360px, (min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className={`${paddingClass} flex flex-col h-full`}>
        <div className={`${isSmall ? 'mb-1.5' : 'mb-2'} flex flex-col gap-1`}>
          <h3 className={`${titleClass} text-dark-900 line-clamp-2 min-h-[2.5em]`}>{title}</h3>
          {displayPrice && (
            <div className="mt-2 flex items-center">
              <span className={`${priceClass} text-dark-900 tracking-tight`}>
                {displayPrice}
              </span>
            </div>
          )}
        </div>
        {description && <p className={`${textClass} text-dark-700`}>{description}</p>}
        {subtitle && <p className={`${textClass} text-dark-700`}>{subtitle}</p>}
        {meta && (
          <p className={`mt-1 ${isSmall ? 'text-xs' : 'text-caption'} text-dark-700`}>
            {Array.isArray(meta) ? meta.join(" • ") : meta}
          </p>
        )}
        {brandName && (
          <div className={`mt-auto ${isSmall ? 'pt-1' : 'pt-2'} flex items-center justify-end gap-2`}>
            {brandLogoUrl && (
              <Image
                src={brandLogoUrl}
                alt={brandName}
                width={20}
                height={20}
                className="object-contain"
              />
            )}
            <p className={`${isSmall ? 'text-xs' : 'text-caption'} font-semibold uppercase tracking-wide text-dark-500`}>
              {brandName}
            </p>
          </div>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link
      href={href}
      aria-label={title}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
