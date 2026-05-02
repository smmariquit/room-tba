import { track } from "@vercel/analytics";

export type AbTestConfig<T extends readonly string[]> = {
  name: string;
  variants: T;
};

export const searchClassCtaTest = {
  name: "search-class-cta",
  variants: ["control", "cta-always"] as const,
} satisfies AbTestConfig<readonly ["control", "cta-always"]>;

export type SearchClassCtaVariant =
  (typeof searchClassCtaTest)["variants"][number];

const STORAGE_PREFIX = "ab-test:";
const OVERRIDE_PREFIX = "ab-";
const CLIENT_ID_KEY = `${STORAGE_PREFIX}client-id`;

const canUseBrowser = typeof window !== "undefined";

const getStorageKey = (testName: string) => `${STORAGE_PREFIX}${testName}`;
const getExposureKey = (testName: string) =>
  `${STORAGE_PREFIX}${testName}:exposed`;

const getOverrideVariant = <T extends readonly string[]>(
  testName: string,
  variants: T,
): T[number] | null => {
  if (!canUseBrowser) return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get(`${OVERRIDE_PREFIX}${testName}`);
  if (override && variants.includes(override)) {
    return override as T[number];
  }
  return null;
};

const readStoredVariant = <T extends readonly string[]>(
  testName: string,
  variants: T,
): T[number] | null => {
  if (!canUseBrowser) return null;
  try {
    const stored = localStorage.getItem(getStorageKey(testName));
    if (stored && variants.includes(stored)) {
      return stored as T[number];
    }
  } catch {
    return null;
  }
  return null;
};

const persistVariant = (testName: string, variant: string) => {
  if (!canUseBrowser) return;
  try {
    localStorage.setItem(getStorageKey(testName), variant);
  } catch {
    // ignore storage failures
  }
};

const getClientId = () => {
  if (!canUseBrowser) return null;
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `fallback-${Date.now()}-${Math.random()}`;
    localStorage.setItem(CLIENT_ID_KEY, generated);
    return generated;
  } catch {
    return null;
  }
};

const hasExposure = (testName: string, variant: string) => {
  if (!canUseBrowser) return false;
  try {
    return sessionStorage.getItem(getExposureKey(testName)) === variant;
  } catch {
    return false;
  }
};

const markExposure = (testName: string, variant: string) => {
  if (!canUseBrowser) return;
  try {
    sessionStorage.setItem(getExposureKey(testName), variant);
  } catch {
    // ignore storage failures
  }
};

const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const pickVariant = <T extends readonly string[]>(
  variants: T,
  seed: string,
): T[number] => {
  const hash = hashString(seed);
  return variants[hash % variants.length];
};

/**
 * Assigns a variant for the provided test, optionally tracking exposure.
 * Uses URL overrides (ab-<testName>=variant), persisted client IDs, and
 * local storage to keep assignments stable across sessions.
 */
export const assignAbTest = <T extends readonly string[]>(
  config: AbTestConfig<T>,
  options?: { trackExposure?: boolean },
): T[number] => {
  if (!canUseBrowser) return config.variants[0];

  const override = getOverrideVariant(config.name, config.variants);
  const stored = readStoredVariant(config.name, config.variants);
  let variant = override ?? stored;

  if (!variant) {
    const clientId = getClientId();
    variant = clientId
      ? pickVariant(config.variants, `${config.name}:${clientId}`)
      : config.variants[0];
  }

  if (override || !stored) {
    persistVariant(config.name, variant);
  }

  if ((options?.trackExposure ?? true) && !hasExposure(config.name, variant)) {
    track("ab_exposure", {
      test: config.name,
      variant,
    });
    markExposure(config.name, variant);
  }

  return variant;
};
