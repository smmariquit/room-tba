<script lang="ts">
  import AccountSettingsModal from "@ui/AccountSettingsModal.svelte";
  import AppContextTestShell from "@test/AppContextTestShell.svelte";
  import { loadedAppContext } from "@test/fixtures/app-context";
</script>

<AppContextTestShell data={loadedAppContext()}>
  <AccountSettingsModal />
</AppContextTestShell>
