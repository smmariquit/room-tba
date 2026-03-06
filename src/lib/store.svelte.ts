import type { ClassMapValue, RoomData } from "./types";

interface IRoomStore {
  roomData: RoomData | null;
  classesData: ClassMapValue[];
  open: boolean;
}

interface IFilterStore {
  open: boolean;
  buildingName: string | null;
  collegeName: string | null;
  divisionName: string | null;
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

  openModal = () => {
    this.roomStore.open = true;
  };
  closeModal = () => {
    this.roomStore.open = false;
    this.roomStore.roomData = null;
  };
}

export const currentRoomStore = new RoomStore();

class FilterStore {
  filterStore: IFilterStore = $state({
    open: false,
    buildingName: null,
    collegeName: null,
    divisionName: null,
  });

  openModal = () => {
    this.filterStore.open = true
  }
  closeModal = () => {
    this.filterStore.open = false
  }
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
      ...this.filterStore,
      buildingName: null,
      collegeName: null,
      divisionName: null,
    };
  };
}

export const filterStore = new FilterStore();