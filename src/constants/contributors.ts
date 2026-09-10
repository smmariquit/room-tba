// Campus editors credited manually. GitHub developers load from /api/github/contributors.

import type { ContributorInfo } from "@lib/types";

/** Optional display overrides keyed by GitHub login. */
export const githubProfileOverrides: Record<
  string,
  { name?: string; href?: string }
> = {
  smmariquit: { name: "Simonee Ezekiel Mariquit", href: "https://stimmie.dev" },
  Kenramiscal1106: {
    name: "Ken Daniele Ramiscal",
    href: "https://kendan.dev",
  },
  klnwlks: { name: "Kalinaw Lukas Aom Bebis", href: "https://lukasbebis.com" },
  unisA02: { name: "Eunice Almeyda" },
  meonnn: { name: "Simeon Ricalde", href: "https://meonnn.github.io/" },
};

/** Design credits for people who did not appear in GitHub commit history. */
export const designers: ContributorInfo[] = [
  { name: "Rovic Villaralvo", href: "https://rovicdesign.framer.website/" },
  { name: "Gwy Telmosa" },
];

export const contributors: ContributorInfo[] = [
  { name: "Niño Anthony Marmeto" },
  { name: "Rosh Almario" },
];
