<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type SelectItemProps = { value: string; label?: string; disabled?: boolean; children?: any };
</script>

<script lang="ts">
  import { getContext } from "svelte";
  const ctx = getContext<any>("select-ctx");
  let { value, label, children, disabled = false }: SelectItemProps = $props();
  const selected = $derived(ctx.value === value);
  function onSelect() { if (!disabled) ctx.setValue(value); }
</script>

<div role="option" tabindex="0" aria-selected={selected} class={cn("flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground", disabled && "opacity-50 cursor-not-allowed")} onclick={onSelect} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}>
  <span class="inline-flex size-4 items-center justify-center">{#if selected}✓{/if}</span>
  <span>{#if children}{@render children?.()}{:else}{label}{/if}</span>
</div>


