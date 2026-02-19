import type { ClassMapValue, RoomData } from "./types";

class RoomStore {
  currentRoomStore: {
    roomData: RoomData | null;
    classesData: ClassMapValue[];
    open:boolean;
  } = $state({
    roomData: null,
    classesData: [],
    open: false
  })
  
  updateRoom = (roomData: RoomData) => {
    this.currentRoomStore.roomData = roomData;
  }

  updateClasses = (classesData: ClassMapValue[]) => {
    this.currentRoomStore.classesData = classesData;
  }

  openModal = () => {
    this.currentRoomStore.open = true;
  }
  closeModal = () => {
    this.currentRoomStore.open = false;
  }
    
  
}

export const currentRoomStore = new RoomStore()