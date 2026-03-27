<script lang="ts">
  import { getAppData } from "../../lib/context";
  import { queryStore, type QueryStoreState } from "../../lib/store.svelte";

  const { buildings, colleges, divisions } = getAppData();

  const suggestedResult = $derived<
    { value: string; category: Exclude<QueryStoreState["category"], null> }[]
  >(getSuggestions(queryStore.value));

  function getSuggestions(searchString: string): {
    value: string;
    category: Exclude<QueryStoreState["category"], null>;
  }[] {
    if (searchString === "") return [];
    searchString = searchString.trim().toLowerCase();
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
    };

    return Array.from(Object.values(suggestions)).reduce(
      (prev, curr) => prev.concat(curr),
      [],
    ) as {
      value: string;
      category: Exclude<QueryStoreState["category"], null>;
    }[];
  }
  $inspect(suggestedResult);
</script>
