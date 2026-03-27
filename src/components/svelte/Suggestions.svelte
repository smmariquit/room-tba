<script lang="ts">
  import { getAppData } from "../../lib/context";
  import { queryStore, type QueryStoreState } from "../../lib/store.svelte";
  const { buildings, colleges, divisions, rooms } = getAppData();

  const suggestedResult = $derived<
    { value: string; category: Exclude<QueryStoreState["category"], null> }[]
  >(getSuggestions(queryStore.value));

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
  $inspect(suggestedResult);
</script>
