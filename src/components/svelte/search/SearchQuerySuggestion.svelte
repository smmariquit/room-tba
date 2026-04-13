<script lang="ts">
  import { queryStore } from "../../../lib/store.svelte";

  function handleRoomSearchSuggestion() {
    queryStore.updateQuery({
      category: "class",
      type: "result",
      value: queryStore.inputValue,
    });
  }
</script>

<button onclick={handleRoomSearchSuggestion}>
  <div>
    Search for classes of <strong>{queryStore.inputValue}</strong> in rooms
  </div>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    ><line x1="7" y1="17" x2="17" y2="7"></line><polyline
      points="7 7 17 7 17 17"
    ></polyline></svg
  >
</button>

<style>
  button {
    all: unset;
    padding: 0.5rem 0.75rem;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
      background-color: hsl(0, 0%, 95%);
      border-radius: 0.75rem;
    }
  }
</style>
