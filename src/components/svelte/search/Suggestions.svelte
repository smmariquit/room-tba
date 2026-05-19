<script lang="ts">
  import { getAppData } from "../../../lib/context";
  import { queryStore, type QueryStoreState, dormFilter, type DormFilterType } from "../../../lib/store.svelte";
  import SearchQuerySuggestion from "./SearchQuerySuggestion.svelte";
  import Suggestion from "./Suggestion.svelte";

  const { buildings, colleges, divisions, rooms, dorms } = getAppData();

  const filteredDorms = $derived(
    dormFilter.value === "all"
      ? dorms
      : dormFilter.value === "up"
        ? dorms.filter((d) => d.is_up_managed)
        : dorms.filter((d) => !d.is_up_managed),
  );

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
      dorms: filteredDorms
        .filter(
          ({ dorm_name, short_name }) =>
            dorm_name.toLowerCase().includes(searchString) ||
            (short_name && short_name.toLowerCase().includes(searchString)),
        )
        .map(({ dorm_name }) => ({
          value: dorm_name,
          category: "dorm",
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

    return [...nonRoomResult, ...roomResult].slice(0, 8);
  }

  const hasDormResults = $derived(
    suggestedResult.some((s) => s.category === "dorm"),
  );

  const filterOptions: { label: string; value: DormFilterType }[] = [
    { label: "All", value: "all" },
    { label: "UP-managed", value: "up" },
    { label: "Private", value: "private" },
  ];
</script>

<!-- class:visible={queryStore.inputValue === ""} -->
<div class="suggestions-container">
  <!-- class:force-visible={queryStore.inputValue === ""} -->
  {#if queryStore.inputValue === ""}
    {#if queryStore.recentSearches.length !== 0}
      <h2 class="suggestions-header">Recent searches</h2>
      {#each queryStore.recentSearches as { category, value }, id (id)}
        <Suggestion {value} {category} {id} />
      {/each}
    {:else}
      <h2 class="suggestions-header">Trending searches</h2>
      <Suggestion value={"Physical Sciences Building"} category={"building"} />
      <Suggestion
        value={"Institute of Computer Science"}
        category={"division"}
      />
      <Suggestion
        value={"Institute of Biological Sciences"}
        category={"division"}
      />
      <Suggestion
        value={"College of Engineering and Agro-Industrial Technology"}
        category={"college"}
      />
    {/if}
  {:else if suggestedResult.length !== 0}
    {#if hasDormResults}
      <div class="filter-chips">
        {#each filterOptions as opt}
          <button
            class="filter-chip"
            class:active={dormFilter.value === opt.value}
            onclick={() => dormFilter.set(opt.value)}
          >
            {opt.label}
          </button>
        {/each}
      </div>
    {/if}
    {#each suggestedResult as suggestion, id (id)}
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
  /* .force-visible {
    opacity: 1;
    pointer-events: auto;
  } */
  .suggestions-header {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .filter-chips {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-chip {
    all: unset;
    cursor: pointer;
    padding: 0.25rem 0.625rem;
    border-radius: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    background-color: hsl(0, 0%, 94%);
    color: hsl(0, 0%, 40%);
    transition: all 0.15s;
  }

  .filter-chip:hover {
    background-color: hsl(0, 0%, 88%);
  }

  .filter-chip.active {
    background-color: hsl(5, 53%, 30%);
    color: white;
  }

  @media (max-width: 425px) {
    .suggestions-header {
      margin-bottom: 0.25rem;
    }
  }
</style>
