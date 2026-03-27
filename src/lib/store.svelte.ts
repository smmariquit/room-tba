import type { modalOptions } from "../constants/modal-states";
import type {
  ClassMapValue,
  RoomData,
} from "./types";
import { SvelteMap } from "svelte/reactivity"

interface ModalStoreState {
  open: boolean;
  type: typeof modalOptions[number] | null;
}

interface RoomStoreState {
  roomData: RoomData | null;
  classesData: ClassMapValue[];
}

export interface QueryStoreState {
  type: "query" | "result" | null;
  category: "building" | "division" | "college" | "room" | null
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

class RoomStore {
  private _roomStore: RoomStoreState = $state({
    roomData: null,
    classesData: [],
  });

  roomData = $derived(this._roomStore.roomData);
  classesData = $derived(this._roomStore.classesData);

  updateRoom = (roomData: RoomData) => {
    this._roomStore.roomData = roomData;
  };

  updateClasses = (classesData: ClassMapValue[]) => {
    this._roomStore.classesData = classesData;
  };
}

class QueryStore {
  private _queryStore: QueryStoreState = $state({
    category: null,
    type: null,
  })
  private _filters = new SvelteMap<string, Exclude<QueryStoreState["category"], null>>();
  value = $state("");
  category = $derived(this._queryStore.category)
  type = $derived(this._queryStore.type)
  filterValues = $derived(Array.from(this._filters.entries().map(([value, category]) => ({
    category,
    value
  }))))
  
  // onclick of query buttons
  updateQuery = (obj: QueryStoreState) => {
    this._queryStore = obj;
  }

  // when clicking the x button
  clearQuery = () => {
    this._queryStore = {
      category: null,
      type: null
    }
  }

  setType(type: typeof this.type) {
    this.type = type;
  }

  addFilter = (key: string, category: Exclude<QueryStoreState["category"], null>) => {
    this._filters.set(key, category)
  }

  removeFilter = (key: string) => {
    this._filters.delete(key);
  }

  clearFilter = () => {
    this._filters.clear();
  }



}

export const queryStore = new QueryStore();
export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
