<script lang="ts">
  import { throttle } from "es-toolkit";
  import { queryStore } from "../../../lib/store.svelte";
  import Suggestions from "./Suggestions.svelte";

  let searchElement = $state<HTMLInputElement | null>(null);
  let typing = $state(false);

  const throttleSearch = throttle((searchInput: string) => {
    queryStore.value = searchInput;
    queryStore.setType("query");
  }, 500);

  function handleInput(
    event: Event & { currentTarget: EventTarget & HTMLInputElement },
  ) {
    throttleSearch(event.currentTarget.value);
  }

  function closeSearchContext() {
    queryStore.clearQuery();
    searchElement?.focus();
    console.log(queryStore.value);
  }
  $inspect(queryStore.value);
</script>

<div class="search-filter-container">
  <div class="search-filter">
    <div class="search-container">
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
        class="search-icon"
        ><circle cx="11" cy="11" r="8" /><line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
        /></svg
      >
      <input
        type="text"
        id="search"
        autocomplete="off"
        value={queryStore.value}
        bind:this={searchElement}
        class={typing ? "typing" : ""}
        oninput={handleInput}
        placeholder={"Search room code, building, division..."}
      />
      {#if typing}
        <div class="loading-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            width="20"
            height="20"
          >
            <circle stroke-width="17" r="15" cx="40" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="-.4"
              ></animate></circle
            >
            <circle stroke-width="17" r="15" cx="100" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="-.2"
              ></animate></circle
            >
            <circle stroke-width="17" r="15" cx="160" cy="65"
              ><animate
                attributeName="cy"
                calcMode="spline"
                dur="0.8"
                values="65;135;65;"
                keySplines=".5 0 .5 1;.5 0 .5 1"
                repeatCount="indefinite"
                begin="0"
              ></animate></circle
            >
          </svg>
        </div>
      {/if}
    </div>

    <div class="search-buttons">
      {#if queryStore.value !== ""}
        <button
          onclick={closeSearchContext}
          type="button"
          class="clear-btn"
          aria-label="Clear Search"
        >
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
            ><line x1="18" y1="6" x2="6" y2="18"></line><line
              x1="6"
              y1="6"
              x2="18"
              y2="18"
            ></line></svg
          >
        </button>
      {/if}
    </div>
  </div>
  <Suggestions />
</div>

<style>
  .search-filter-container {
    position: relative;
    pointer-events: auto;
  }

  .search-filter {
    background-color: white;
    border-radius: 0.8125rem;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  @media screen and (max-width: 48rem) {
    .search-filter {
      pointer-events: auto;
      border-radius: 2rem; /* Pill shape for mobile */
    }
  }

  .search-container {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .search-icon {
    position: absolute;
    left: 0;
    color: black;
  }

  input[type="text"] {
    width: 100%;
    border: none;
    outline: none;
    padding-left: 1.75rem;
    font-size: 0.875rem;
    color: black;
    background: transparent;
    text-overflow: ellipsis;
  }

  input[type="text"]::placeholder {
    color: #6b6b6b;
  }

  .search-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .clear-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
  }

  .loading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.5rem;
  }

  .loading-icon svg {
    fill: #7b2d26;
    stroke: #7b2d26;
  }
</style>
