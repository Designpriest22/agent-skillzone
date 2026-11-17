/** Icon set: 24px grid, 2px rounded strokes, currentColor. Drawn for Over Sabi. */
const P = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const S = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
    {children}
  </svg>
);

export const IconHome = () => (
  <S>
    <path {...P} d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
  </S>
);
export const IconLearn = () => (
  <S>
    <path
      {...P}
      d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20"
    />
  </S>
);
export const IconSpeak = () => (
  <S>
    <path {...P} d="M4 12c2-3 3-3 4 0s2 3 4 0 2-3 4 0 2 3 4 0" />
    <path {...P} d="M4 18h9" opacity=".5" />
  </S>
);
export const IconTutors = () => (
  <S>
    <circle {...P} cx="9" cy="8" r="3.5" />
    <path
      {...P}
      d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .8 3.2 2.5 3.6 5.2"
    />
  </S>
);
export const IconVocab = () => (
  <S>
    <path {...P} d="M6 3h11a1 1 0 0 1 1 1v17l-6.5-4L5 21V4a1 1 0 0 1 1-1z" />
  </S>
);
export const IconProgress = () => (
  <S>
    <path {...P} d="M3 20h18M6 16v-4M11 16V8M16 16v-6M20.5 5 17 8.5l-3-2L10 10" />
  </S>
);
export const IconSettings = () => (
  <S>
    <circle {...P} cx="12" cy="12" r="3" />
    <path
      {...P}
      d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"
    />
  </S>
);
export const IconReview = () => (
  <S>
    <path {...P} d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
  </S>
);
export const IconBell = () => (
  <S>
    <path {...P} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
  </S>
);
export const IconShield = () => (
  <S>
    <path {...P} d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6z" />
  </S>
);
export const IconMic = () => (
  <S>
    <rect {...P} x="9" y="3" width="6" height="11" rx="3" />
    <path {...P} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </S>
);
export const IconMicOff = () => (
  <S>
    <path
      {...P}
      d="M15 9.5V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.8 2.4M5.5 11a6.5 6.5 0 0 0 10.6 5M18.5 11a6.5 6.5 0 0 1-.6 2.7M12 17.5V21M3 3l18 18"
    />
  </S>
);
export const IconPlay = () => (
  <S>
    <path {...P} d="M7 4.5v15l12-7.5z" />
  </S>
);
export const IconSend = () => (
  <S>
    <path {...P} d="M4 12 20 4l-6 16-3-7z" />
  </S>
);
export const IconCheck = () => (
  <S>
    <path {...P} d="m4.5 12.5 5 5 10-11" />
  </S>
);
export const IconX = () => (
  <S>
    <path {...P} d="M6 6l12 12M18 6 6 18" />
  </S>
);
export const IconFlame = () => (
  <S>
    <path
      {...P}
      d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 3 2 4 4.2 4 6.2 1-1 1.5-2 1.6-3.2 2 1.8 3.4 4.2 3.4 7 0 3.4-2.5 6-6.5 6z"
    />
  </S>
);
