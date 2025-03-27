interface IconProps {
  className?: string;
  size?: number;
}

export const ShipIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M20.9 19.8L13.1 12l7.8-7.8c.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0L12 10.6 4.7 3.3c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4l7.8 7.8-7.8 7.8c-.4.4-.4 1 0 1.4.2.2.5.3.7.3.2 0 .5-.1.7-.3l7.8-7.8 7.8 7.8c.2.2.5.3.7.3.2 0 .5-.1.7-.3.4-.4.4-1 0-1.4z" />
  </svg>
);

export const PlanetIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

export const StationIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.7L19.7 8 12 11.3 4.3 8 12 4.7zM4 9.7l7 3.5v5.1l-7-3.5V9.7zm9 8.6v-5.1l7-3.5v5.1l-7 3.5z" />
  </svg>
);

export { default as FuelIcon } from './FuelIcon';

export { default as CargoIcon } from './CargoIcon';

export { default as CreditsIcon } from './CreditsIcon';

export { default as ShieldIcon } from './ShieldIcon';

export { default as KeyboardIcon } from './KeyboardIcon';

export const WeaponIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M7 5h10v2h2V3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v4h2V5zm8.03 3.97l1.41 1.41-3.54 3.54-1.41-1.41 3.54-3.54zM9.5 9.5l1.41 1.41L7.37 14.4 5.96 13l3.54-3.5zM7 17h10v2H7z" />
  </svg>
);

export const EngineIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
); 