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

const pickVariant = <T extends readonly string[]>(variants: T): T[number] => {
  const index = Math.floor(Math.random() * variants.length);
  return variants[index];
};

export const assignAbTest = <T extends readonly string[]>(
  config: AbTestConfig<T>,
  options?: { trackExposure?: boolean },
): T[number] => {
  if (!canUseBrowser) return config.variants[0];

  const override = getOverrideVariant(config.name, config.variants);
  const stored = readStoredVariant(config.name, config.variants);
  let variant = override ?? stored;

  if (!variant) {
    variant = pickVariant(config.variants);
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
