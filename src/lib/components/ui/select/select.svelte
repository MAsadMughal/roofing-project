<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLSelectAttributes } from "svelte/elements";

  export type SelectItem = { value: string; label?: string };
  export type SelectProps = WithElementRef<HTMLSelectAttributes> & {
    class?: string;
    items?: SelectItem[];
  };
</script>

<script lang="ts">
  type $$Events = { change: Event; input: Event };
  let {
    class: className,
    ref = $bindable(null),
    value = $bindable<string | number | string[] | undefined>(),
    items = undefined,
    children,
    ...rest
  }: SelectProps = $props();
</script>

<div class="relative inline-flex w-max min-w-40">
  <select
    bind:this={ref}
    class={cn(
      "h-10 w-full appearance-none rounded-md border bg-background px-3 pr-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      className
    )}
    bind:value
    {...rest}
  >
    {#if items}
      {#each items as it}
        <option value={it.value}>{it.label ?? it.value}</option>
      {/each}
    {:else}
      {@render children?.()}
    {/if}
  </select>
  <svg class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
  </div>


