import Image from 'next/image';
import { toPublicProjectPath } from '@/lib/project-path';

type ProjectImageProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export function ProjectImage({ src, alt, caption, width = 1200, height = 520 }: ProjectImageProps) {
  return (
    <figure className="my-7">
      <Image src={toPublicProjectPath(src)} alt={alt} width={width} height={height} sizes="(max-width: 900px) 100vw, 900px" />
      {caption ? <figcaption className="mt-2 text-sm text-fd-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
