import { iconUrl } from '@/lib/icons';

interface ItemIconProps {
  icon?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
  imgClassName?: string;
}

export const ItemIcon = ({
  icon,
  alt = '',
  fallbackText,
  className = 'w-full h-full flex items-center justify-center',
  imgClassName = 'max-w-full max-h-full object-contain',
}: ItemIconProps) => {
  if (!icon) {
    return (
      <div className={className}>
        <span className="text-[9px] text-gray-400 text-center leading-tight">
          {fallbackText ?? '—'}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={iconUrl(icon)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={imgClassName}
      />
    </div>
  );
};
