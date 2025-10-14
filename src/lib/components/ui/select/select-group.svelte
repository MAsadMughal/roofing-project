<script lang="ts" module>
  import type { Snippet } from "svelte";
  export type SelectGroupProps = { children?: Snippet };
</script>

<script lang="ts">
  let { children }: SelectGroupProps = $props();
</script>

<div role="group" class="py-1">
  {@render children?.()}
</div>


