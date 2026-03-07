import type {
  BuildingData,
  ClassMapValue,
  RoomData,
  CollegeData,
  DivisionData,
} from "./types";

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
  buildings: BuildingData[];
  colleges: CollegeData[];
  divisions: DivisionData[];
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
    buildings: [],
    colleges: [],
    divisions: [],
  });

  filterData = $derived({
    buildingName: this._filterStore.buildingName,
    collegeName: this._filterStore.collegeName,
    divisionName: this._filterStore.divisionName,
  });

  getData = () => ({
    buildings: this._filterStore.buildings,
    colleges: this._filterStore.colleges,
    divisions: this._filterStore.divisions,
  });

  setBuilding = (buildingName: string) => {
    this._filterStore.buildingName = buildingName;
  };
  setCollege = (collegeName: string) => {
    this._filterStore.collegeName = collegeName;
  };
  setDivision = (divisionName: string) => {
    this._filterStore.divisionName = divisionName;
  };

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
      buildingName: null,
      collegeName: null,
      divisionName: null,
    };
  };
}

export const filterStore = new FilterStore();
export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
