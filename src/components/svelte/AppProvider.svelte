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

  type Props = {
    rooms: RoomData[];
    buildings: BuildingData[];
    colleges: CollegeData[];
    divisions: DivisionData[];
    classesMap: Map<string, ClassMapValue[]>;
  };
  const appData: Props = $props();
  // svelte-ignore state_referenced_locally
  setAppData(appData);
</script>

<Entry />
