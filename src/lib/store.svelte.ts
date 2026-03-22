import type {
  BuildingData,
  ClassMapValue,
  RoomData,
  CollegeData,
  DivisionData,
  IFilterStore,
} from "./types";

interface IModalStore {
  open: boolean;
  type: "room-details" | "filters" | null;
}

interface IRoomStore {
  roomData: RoomData | null;
  classesData: ClassMapValue[];
}

class ModalStore {
  private _modalStore: IModalStore = $state({
    open: false,
    type: null,
  });

  open = $derived(this._modalStore.open);
  type = $derived(this._modalStore.type);

  openModal = (type: IModalStore["type"]) => {
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
  private _roomStore: IRoomStore = $state({
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

class FilterStore {
  private _filterStore: IFilterStore = $state({
    filter: null,
    type: null,
    buildings: [],
    colleges: [],
    divisions: [],
  });

  filterData = $derived({
    type: this._filterStore.type,
    filter: this._filterStore.filter
  });

  getData = () => ({
    buildings: this._filterStore.buildings,
    colleges: this._filterStore.colleges,
    divisions: this._filterStore.divisions,
  });

  setFilter = (type: IFilterStore["type"], filter: string | null) => {
    this._filterStore.type = type;
    this._filterStore.filter = filter;
  }

  setData = ([buildings, colleges, divisions]: [
    BuildingData[],
    CollegeData[],
    DivisionData[],
  ]) => {
    this._filterStore.buildings = buildings;
    this._filterStore.colleges = colleges;
    this._filterStore.divisions = divisions;
  };

  resetFilter = () => {
    this._filterStore = {
      ...this._filterStore,
      filter: null,
      type: null
    };
  };
}

class OnlineStore {
  private _isOnline = $state(typeof window !== "undefined" ? window.navigator.onLine : true);

  isOnline = $derived(this._isOnline);

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => (this._isOnline = true));
      window.addEventListener("offline", () => (this._isOnline = false));
    }
  }
}

export const filterStore = new FilterStore();
export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
export const onlineStore = new OnlineStore();
