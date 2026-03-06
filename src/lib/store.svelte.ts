import type { ClassMapValue, RoomData } from "./types";

interface IModalStore {
  open: boolean;
  type: "room-details" | "filters" | null;
}

interface IRoomStore {
  roomData: RoomData | null;
  classesData: ClassMapValue[];
}

interface IFilterStore {
  buildingName: string | null;
  collegeName: string | null;
  divisionName: string | null;
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
    buildingName: null,
    collegeName: null,
    divisionName: null,
  });

  buildingName = $derived(this._filterStore.buildingName);
  collegeName = $derived(this._filterStore.collegeName);
  divisionName = $derived(this._filterStore.divisionName);

  setBuilding = (buildingName: string) => {
    this._filterStore.buildingName = buildingName;
  };
  setCollege = (collegeName: string) => {
    this._filterStore.collegeName = collegeName;
  };
  setDivision = (divisionName: string) => {
    this._filterStore.divisionName = divisionName;
  };
  resetFilter = () => {
    this._filterStore = {
      buildingName: null,
      collegeName: null,
      divisionName: null,
    };
  };
}

export const filterStore = new FilterStore();
export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
