import type { ClassMapValue, RoomData } from "./types";

interface IModalStore {
  open:boolean;
  type: "room-details" | "filters" | null
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
  modalStore: IModalStore = $state({
    open:false,
    type: null
  })

  openModal = (type: IModalStore["type"]) => {
    this.modalStore.open = true;
    this.modalStore.type = type;
  }

  closeModal = () => {
    this.modalStore = {
      open: false,
      type: null
    }
  }
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