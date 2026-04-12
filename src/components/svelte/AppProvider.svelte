<script lang="ts">
  import { setAppData } from "../../lib/context";
  import type {
    BuildingData,
    ClassMapValue,
    CollegeData,
    DivisionData,
    RoomData,
  } from "../../lib/types";
  import Entry from "./Entry.svelte";
  import { queryStore } from "../../lib/store.svelte";

  type Props = {
    rooms: RoomData[];
    buildings: BuildingData[];
    colleges: CollegeData[];
    divisions: DivisionData[];
    classesMap: Map<string, ClassMapValue[]>;
    totalRooms: number;
    directionCount: number;
    initialQuery?: any;
  };
  
  let { initialQuery, ...restProps }: Props = $props();
  
  //svelte-ignore state_referenced_locally
  setAppData(restProps);

  //svelte-ignore state_referenced_locally
  if (initialQuery) {
    queryStore.updateQuery(initialQuery);
    queryStore.inputValue = initialQuery.value;
  }
</script>

<Entry />
