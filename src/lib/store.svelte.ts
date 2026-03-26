import type { modalOptions } from "../constants/modal-states";
import type {
  ClassMapValue,
  RoomData,
  IFilterStore,
} from "./types";

interface ModalStoreState {
  open: boolean;
  type: typeof modalOptions[number] | null;
}

interface RoomStoreState {
  roomData: RoomData | null;
  classesData: ClassMapValue[];
}

interface QueryStoreState {
  type: "query" | "result";
  category: "building" | "division" | "college" | "rooms"
  filters: {
    type: "building" | "division" | "college",
    value: string
  }[]
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



export const currentRoomStore = new RoomStore();
export const modalStore = new ModalStore();
