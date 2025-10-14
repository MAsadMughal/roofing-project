<script lang="ts" module>
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLInputAttributes } from "svelte/elements";

  export type InputProps = WithElementRef<HTMLInputAttributes> & {
    class?: string;
  };
</script>

<script lang="ts">
  type $$Events = {
    input: Event;
    change: Event;
    blur: FocusEvent;
    focus: FocusEvent;
  };

  let { class: className, ref = $bindable(null), value = $bindable(), ...rest }: InputProps = $props();
</script>

<input
  bind:this={ref}
  bind:value={value}
  class={cn(
    "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...rest}
/>


