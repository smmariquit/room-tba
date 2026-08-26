<script lang="ts">
  import Printer from "@lucide/svelte/icons/printer";
  import MapChromeActionLink from "@ui/map-chrome/MapChromeActionLink.svelte";

  type Props = {
    placeName: string;
    ariaLabel?: string;
  };

  let {
    placeName,
    ariaLabel = "Download a printable transit map with this place marked",
  }: Props = $props();

  const href = $derived(
    `/api/transit-map?here=${encodeURIComponent(placeName)}`,
  );
</script>

<MapChromeActionLink {href} {ariaLabel} toolbar>
  <Printer size={14} aria-hidden="true" />
  Printable map
</MapChromeActionLink>
