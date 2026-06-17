import Image from "next/image";
import { BrowserComponent } from "@/components/browser-component";

export function FeatureShot({
  url,
  src,
  alt,
  priority = false,
  className,
}: {
  url: string;
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <BrowserComponent url={url} className="h-auto">
        <Image
          src={src}
          alt={alt}
          height={1080}
          width={1920}
          className="w-full h-auto object-contain"
          priority={priority || undefined}
          unoptimized={priority || undefined}
        />
      </BrowserComponent>
    </div>
  );
}
