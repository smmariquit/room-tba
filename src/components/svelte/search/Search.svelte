<script lang="ts">
  import { throttle } from "es-toolkit";
  import { queryStore, modalStore } from "../../../lib/store.svelte";
  import Suggestions from "./Suggestions.svelte";

  let searchElement = $state<HTMLInputElement | null>(null);
  let typing = $state(false);
  let focused = $state(false);

  const throttleSearch = throttle((searchInput: string) => {
    queryStore.inputValue = searchInput;
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
    console.log(queryStore.inputValue);
  }
</script>

<div
  class="search-filter-container"
  class:search-focused={queryStore.type !== "result"}
>
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
        value={queryStore.inputValue}
        bind:this={searchElement}
        class={typing ? "typing" : ""}
        oninput={handleInput}
        onfocus={() => (focused = true)}
        onblur={() => setTimeout(() => (focused = false), 200)}
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
      <button
        onclick={() => modalStore.openModal("filter")}
        type="button"
        class="filter-btn"
        aria-label="Open Filters"
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
          class="lucide lucide-filter"
          ><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg
        >
      </button>
      {#if queryStore.inputValue !== ""}
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
    width: min(25.75rem, calc(50% - 4rem));
    pointer-events: auto;
  }

  .search-focused:focus-within :first-child + :global(*) {
    opacity: 1;
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
    .search-filter-container {
      width: 100%;
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

  .clear-btn,
  .filter-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.125s;
  }

  .clear-btn:hover,
  .filter-btn:hover {
    background-color: #f0f0f0;
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
