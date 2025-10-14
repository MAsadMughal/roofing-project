<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type SelectContentProps = { class?: string; children?: any };
</script>

<script lang="ts">
  import { getContext } from "svelte";
  const ctx = getContext<any>("select-ctx");
  let { class: className, children }: SelectContentProps = $props();
</script>

{#if ctx.open}
<div class={cn("mt-2 w-[var(--trigger-w,180px)] rounded-md border bg-popover p-1 shadow-md", className)} role="listbox">
  {@render children?.()}
</div>
{/if}


