import type { RecentSearch } from "./types";

export const isRecentSearch = (recentSearch: unknown): recentSearch is RecentSearch  => !!recentSearch && typeof recentSearch === "object" && "value" in recentSearch && typeof (recentSearch as RecentSearch).value === "string";

type Dog = { name: string }
const isDog = (value: unknown): value is Dog => !!value && typeof value === 'object' && 'name' in value && typeof (value as Dog).name === 'string'
