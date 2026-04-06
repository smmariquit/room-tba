import type { modalOptions } from "../constants/modal-states";
import { SvelteMap } from "svelte/reactivity";
import type { RecentSearch } from "./types";

interface ModalStoreState {
  open: boolean;
  type: (typeof modalOptions)[number] | null;
}

export interface QueryStoreState {
  type: "query" | "result";
  category: "building" | "division" | "college" | "room" | null;
}

class ModalStore {
  private _modalStore: ModalStoreState = $state({
    open: false,
    type: null,
  });

  open = $derived(this._modalStore.open);
  type = $derived(this._modalStore.type);

  openModal = (type: ModalStoreState["type"]) => {
    this._modalStore.open = true;
    this._modalStore.type = type;
  };

  closeModal = () => {
    this._modalStore = {
      open: false,
      type: null,
    };
  };
}

class QueryStore {
  private _queryStore: QueryStoreState = $state({
    category: null,
    type: "query",
  });
  recentSearches: RecentSearch[] = $state([]);
  private _filters = new SvelteMap<
    string,
    Exclude<QueryStoreState["category"], null>
  >();
  value = $state("");
  category = $derived(this._queryStore.category);
  type = $derived(this._queryStore.type);
  filterValues = $derived(
    Array.from(
      this._filters.entries().map(([value, category]) => ({
        category,
        value,
      })),
    ),
  );

  // onclick of query buttons
  updateQuery = (obj: QueryStoreState, value: string) => {
    this._queryStore = obj;
    this.value = value;
    if (obj.type === "result" && obj.category !== null) {
      this.addRecentSearch({
        category: obj.category,
        value
      });
    }
  };

  addRecentSearch(recentSearch: RecentSearch) {
    const qIndex = this.recentSearches.findIndex(query => query.value === recentSearch.value && query.category === recentSearch.category);
    if (qIndex !== -1)
      this.recentSearches.splice(qIndex, 1);
    else if (this.recentSearches.length > 4)
      this.recentSearches.pop();

    this.recentSearches.unshift(recentSearch);
  }

  // when clicking the x button
  clearQuery = () => {
    this._queryStore = {
      category: null,
      type: "query",
    };
    this.value = "";
  };

  setType(type: typeof this.type) {
    this.type = type;
  }

  addFilter = (
    key: string,
    category: Exclude<QueryStoreState["category"], null>,
  ) => {
    this._filters.set(key, category);
  };

  removeFilter = (key: string) => {
    this._filters.delete(key);
  };

  clearFilter = () => {
    this._filters.clear();
  };
}

export const queryStore = new QueryStore();
export const modalStore = new ModalStore();
