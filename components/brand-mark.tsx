import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TAGLINE = "ASHWIN - Affordable Scans & Healthcare via Wide Integrated Network";

export function BrandMark({
  linked = true,
  size = "default",
  className
}: {
  linked?: boolean;
  size?: "default" | "hero";
  className?: string;
}) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/ashwin-logo.png"
        alt="Ashwin logo"
        width={size === "hero" ? 72 : 52}
        height={size === "hero" ? 72 : 52}
        className="h-auto w-12 shrink-0 sm:w-14"
        priority
      />
      <div className="min-w-0">
        <p
          className={cn(
            "font-black leading-tight text-clinic",
            size === "hero" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"
          )}
        >
          Ashwin Healthcare System
        </p>
        <p className="mt-1 max-w-3xl text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))] sm:text-sm">
          {TAGLINE}
        </p>
      </div>
    </div>
  );

  if (!linked) {
    return content;
  }

  return (
    <Link href="/" className="block">
      {content}
    </Link>
  );
}
