import { createContext } from "svelte"
import type { BuildingData, ClassMapValue, CollegeData, DivisionData, RoomData } from "./types";

type AppData = {
  rooms: RoomData[];
  buildings: BuildingData[];
  colleges: CollegeData[];
  divisions: DivisionData[];
  classesMap: Map<string, ClassMapValue[]>;
  totalRooms: number;
  directionCount: number;
}

export const [getAppData, setAppData] = createContext<AppData>();