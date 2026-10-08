export interface AvatarProps {
  /** Shown as initials, and read out by screen readers. */
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

// A round badge with someone's initials. For a photo, put an <img className="size-14 rounded-full"> in its place.
export function Avatar({ name, size = 'md', className = '' }: AvatarProps): React.JSX.Element {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-lighter font-title font-bold text-primary ${
        size === 'md' ? 'size-14 text-h2' : 'size-10 text-content-2'
      } ${className}`}
    >
      {initials}
    </span>
  );
}
