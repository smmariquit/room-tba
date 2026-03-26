<script lang="ts">
  import { getAppData } from "../../lib/context";

  const { directionCount, totalRooms } = getAppData();
</script>

<div>{(directionCount / totalRooms) * 100}</div>

<style>
  div {
    background-color: white;
    padding: 1rem;
    margin-top: auto;
    border-radius: 1rem;
    box-shadow: 0 2px 0.5rem 0 hsla(0, 0%, 0%, 0.2);
  }
</style>
