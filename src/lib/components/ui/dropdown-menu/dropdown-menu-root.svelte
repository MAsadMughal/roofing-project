<script lang="ts" module>
  import type { Snippet } from "svelte";
  export type DropdownMenuRootProps = { open?: boolean; children?: Snippet };
</script>

<script lang="ts">
  import { setContext } from "svelte";
  let { open = $bindable(false), children }: DropdownMenuRootProps = $props();
  function toggle() { open = !open; }
  function close() { open = false; }
  setContext("dropdown-ctx", { get open() { return open; }, toggle, close });
</script>

<div>
  {@render children?.()}
</div>


