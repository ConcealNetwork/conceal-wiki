import { toPublicProjectPath } from '@/lib/project-path';
import Image from 'next/image';

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="conceal-brand" aria-label="Conceal Docs">
      <Image
        src={toPublicProjectPath('/brand/conceal-mark.svg')}
        alt=""
        width={compact ? 28 : 34}
        height={compact ? 28 : 34}
      />
      <span>Conceal Docs</span>
    </span>
  );
}
