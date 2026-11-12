type SpeciesStyle = {
  avatar: string;
  badge: string;
  text: string;
  avatarIcon: string | null;
  badgeIcon: string | null;
};

export const SPECIES_STYLE: Record<string, SpeciesStyle> = {
  Dog: {
    avatar: "bg-butter-soft",
    badge: "bg-butter-soft",
    text: "text-butter-ink",
    avatarIcon: "/icons/dog-avatar.svg",
    badgeIcon: "/icons/dog-badge.svg",
  },
  Cat: {
    avatar: "bg-blush-soft",
    badge: "bg-blush-soft",
    text: "text-blush-ink",
    avatarIcon: "/icons/cat-avatar.svg",
    badgeIcon: "/icons/cat-badge.svg",
  },
  Reptile: {
    avatar: "bg-lime-soft",
    badge: "bg-lime-soft",
    text: "text-lime-ink",
    avatarIcon: "/icons/reptile-avatar.svg",
    badgeIcon: "/icons/reptile-badge.svg",
  },
};

// The design only ships icons for dog, cat and reptile; other species fall
// back to an initial in the avatar and a text-only badge.
export const FALLBACK_STYLE: SpeciesStyle = {
  avatar: "bg-butter-soft",
  badge: "bg-butter-soft",
  text: "text-butter-ink",
  avatarIcon: null,
  badgeIcon: null,
};

export const styleFor = (species: string) => SPECIES_STYLE[species] ?? FALLBACK_STYLE;

export function PetAvatar({
  name,
  species,
  size = 56,
  className = "",
}: {
  name: string;
  species: string;
  size?: number;
  className?: string;
}) {
  const style = styleFor(species);
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-clip rounded-full font-semibold ${style.avatar} ${style.text} ${className}`}
    >
      {style.avatarIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={style.avatarIcon} alt="" width={size / 2} height={size / 2} />
      ) : (
        <span style={{ fontSize: size / 3 }}>{name[0]?.toUpperCase()}</span>
      )}
    </span>
  );
}

export function SpeciesBadge({ species }: { species: string }) {
  const style = styleFor(species);
  return (
    <span
      className={`flex h-[26px] shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium ${style.badge} ${style.text}`}
    >
      {style.badgeIcon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={style.badgeIcon} alt="" width={13} height={13} />
      ) : null}
      {species}
    </span>
  );
}
