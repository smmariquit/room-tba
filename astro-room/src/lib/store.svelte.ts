import type { ClassMapValue, RoomData } from "./types";

class RoomStore {
  private _currentRoomStore: {
    roomData: RoomData | null;
    classesData: ClassMapValue[];
    open:boolean;
  } = $state({
    roomData: null,
    classesData: [],
    open: false
  })
  
  public updateRoom(roomData: RoomData) {
    this._currentRoomStore.roomData = roomData;
  }

  public updateClasses(classesData: ClassMapValue[]) {
    this._currentRoomStore.classesData = classesData;
  }

  public openModal() {
    this._currentRoomStore.open = true;
  }
  public closeModal() {
    this._currentRoomStore.open = false;
  }
  
  public get roomData() {
    return this._currentRoomStore.roomData
  }

  public get classesData() {
    return this._currentRoomStore.classesData
  }
  
  
  public get open() : boolean {
    return this._currentRoomStore.open
  }
  
}

export const currentRoomStore = new RoomStore()