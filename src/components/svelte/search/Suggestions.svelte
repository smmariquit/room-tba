<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import { queryStore, type QueryStoreState } from "../../../lib/store.svelte";
  import SearchQuerySuggestion from "./SearchQuerySuggestion.svelte";
  import Suggestion from "./Suggestion.svelte";

  const { buildings, colleges, divisions, rooms } = getAppData();

  const suggestedResult = $derived<
    { value: string; category: Exclude<QueryStoreState["category"], null> }[]
  >(getSuggestions(queryStore.inputValue));

  function getSuggestions(searchString: string): {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  }[] {
    searchString = searchString.trim().toLowerCase();
    if (searchString === "") return [];
    const suggestions = {
      buildings: buildings
        .filter(({ building_name }) =>
          building_name.toLowerCase().includes(searchString),
        )
        .map(({ building_name }) => ({
          value: building_name,
          category: "building",
        })),
      colleges: colleges
        .filter(({ college_name }) =>
          college_name.toLowerCase().includes(searchString),
        )
        .map(({ college_name }) => ({
          value: college_name,
          category: "college",
        })),
      divisions: divisions
        .filter(({ division_name }) =>
          division_name.toLowerCase().includes(searchString),
        )
        .map(({ division_name }) => ({
          value: division_name,
          category: "division",
        })),
    } satisfies {
      [key: string]: {
        value: string;
        category: Exclude<QueryStoreState["category"], null>;
      }[];
    };

    const nonRoomResult = Array.from(Object.values(suggestions))
      .reduce(
        // @ts-ignore
        (prev, curr) => [...prev, ...curr],
        [],
      )
      .sort(({ value: a }, { value: b }) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      );

    const roomResult = rooms
      .filter((room) => room.code.toLowerCase().includes(searchString))
      .map((room) => ({
        value: room.code,
        category: "room",
      })) satisfies {
      value: string;
      category: Exclude<QueryStoreState["category"], null>;
    }[];

    return [...nonRoomResult, ...roomResult].slice(0, 5);
  }
</script>

<!-- class:visible={queryStore.inputValue === ""} -->
<div
  class="suggestions-container"
  class:force-visible={queryStore.inputValue === ""}
>
  {#if queryStore.inputValue === ""}
    {#if queryStore.recentSearches.length !== 0}
      <h2 class="suggestions-header">Recent searches</h2>
      {#each queryStore.recentSearches as { category, value }}
        <Suggestion {value} {category} />
      {/each}
    {:else}
      <h2 class="suggestions-header">Trending searches</h2>
      <Suggestion value={"CAS Building"} category={"building"} />
      <Suggestion
        value={"Institute of Computer Science"}
        category={"division"}
      />
      <Suggestion value={"MMM LH"} category={"room"} />
    {/if}
  {:else if suggestedResult.length !== 0}
    {#each suggestedResult as suggestion}
      <Suggestion {...suggestion} />
    {/each}
  {:else if suggestedResult.length === 0}
    <SearchQuerySuggestion />
  {/if}
</div>

<style>
  .suggestions-container {
    position: absolute;
    width: 100%;
    height: max-content;
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    background-color: white;
    pointer-events: none;
    box-shadow: 0rem 2px 0.25rem 0rem rgba(0, 0, 0, 0.25);
    margin-top: 0.5rem;
    opacity: 0;
  }
  .force-visible {
    opacity: 1;
    pointer-events: auto;
  }
  @media screen and (max-width: 48rem) {
    .mobile-hidden {
      display: none;
    }
  }
  .suggestions-header {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
</style>
