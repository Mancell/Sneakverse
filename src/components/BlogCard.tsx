import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";

export interface BlogCardProps {
  title: string;
  excerpt: string;
  imageSrc: string;
  imageAlt?: string;
  href: string;
  date: string;
  category?: string;
  className?: string;
}

export default function BlogCard({
  title,
  excerpt,
  imageSrc,
  imageAlt = title,
  href,
  date,
  category,
  className = "",
}: BlogCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-xl bg-light-100 ring-1 ring-light-300 transition-all hover:ring-dark-500 hover:shadow-lg ${className}`}
    >
      <article className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded-t-xl bg-light-200">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {category && (
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-dark-900/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-light-100 uppercase tracking-wide">
                {category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="mb-3 flex items-center gap-2 text-caption text-dark-500">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={date}>{date}</time>
          </div>

          <h3 className="text-heading-3 text-dark-900 mb-2 line-clamp-2 group-hover:text-dark-700 transition-colors">
            {title}
          </h3>

          <p className="text-body text-dark-700 line-clamp-2 flex-1">
            {excerpt}
          </p>

          <div className="mt-4 pt-3 border-t border-light-300">
            <span className="text-caption font-semibold text-dark-900 group-hover:text-dark-700 transition-colors">
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

