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
  roomStore: IRoomStore = $state({
    roomData: null,
    classesData: [],
    open: false,
  });

  updateRoom = (roomData: RoomData) => {
    this.roomStore.roomData = roomData;
  };

  updateClasses = (classesData: ClassMapValue[]) => {
    this.roomStore.classesData = classesData;
  };
}

class FilterStore {
  filterStore: IFilterStore = $state({
    buildingName: null,
    collegeName: null,
    divisionName: null,
  });

  setBuilding = (buildingName: string) => {
    this.filterStore.buildingName = buildingName;
  };
  setCollege = (collegeName: string) => {
    this.filterStore.collegeName = collegeName;
  };
  setDivision = (divisionName: string) => {
    this.filterStore.divisionName = divisionName;
  };
  resetFilter = () => {
    this.filterStore = {
      buildingName: null,
      collegeName: null,
      divisionName: null,
    };
  };
}

export const filterStore = new FilterStore();
export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
