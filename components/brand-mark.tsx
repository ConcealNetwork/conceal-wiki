import { toPublicProjectPath } from '@/lib/project-path';
import Image from 'next/image';

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  const size = compact ? 28 : 34;
  return (
    <span className="conceal-brand" aria-label="Conceal Docs">
      {/* The silvery official mark reads on dark backgrounds; the warm-charcoal
          variant reads on light ones. CSS switches on the resolved theme class,
          so both render server-side and neither flashes on hydration. */}
      <Image
        src={toPublicProjectPath('/brand/conceal-mark.svg')}
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
      />
      <Image
        src={toPublicProjectPath('/brand/conceal-mark-on-light.svg')}
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
      />
      <span>Conceal Docs</span>
    </span>
  );
}
