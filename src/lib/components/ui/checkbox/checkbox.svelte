<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  export type CheckboxProps = WithElementRef<HTMLInputAttributes> & { class?: string };
</script>

<script lang="ts">
  type $$Events = { change: Event; input: Event };
  let { class: className, ref = $bindable(null), checked = $bindable(false), ...rest }: CheckboxProps = $props();
</script>

<input
  bind:this={ref}
  type="checkbox"
  class={cn(
    "size-4 rounded border accent-primary text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50",
    className
  )}
  {checked}
  {...rest}
/>


