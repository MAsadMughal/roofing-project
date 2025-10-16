<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type DropdownMenuTriggerProps = { class?: string; children?: any };
</script>

<script lang="ts">
  import { getContext } from "svelte";
  const ctx = getContext<any>("dropdown-ctx");
  let { class: className, children }: DropdownMenuTriggerProps = $props();
</script>

<button type="button" class={cn("inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm", className)} aria-haspopup="menu" aria-expanded={ctx.open} onclick={ctx.toggle}>
  {@render children?.()}
  <svg class="ml-2 size-4 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
</button>


