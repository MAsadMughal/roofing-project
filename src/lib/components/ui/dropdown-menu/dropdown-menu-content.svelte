<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type DropdownMenuContentProps = { class?: string; children?: any };
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  const ctx = getContext<any>("dropdown-ctx");
  let { class: className, children }: DropdownMenuContentProps = $props();
</script>

{#if ctx.open}
<div in:fade={{ duration: 120 }} out:fade={{ duration: 100 }}>
  <div
    class={cn("z-50 mt-2 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md origin-top-left will-change-[transform,opacity]", className)}
    role="menu"
    in:scale={{ duration: 120, start: 0.98 }}
    out:scale={{ duration: 100, start: 1 }}
  >
    {@render children?.()}
  </div>
</div>
{/if}


