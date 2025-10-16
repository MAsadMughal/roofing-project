<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type DropdownMenuItemProps = { class?: string; disabled?: boolean; onclick?: () => void; children?: any };
</script>

<script lang="ts">
  let { class: className, disabled = false, children, onclick }: DropdownMenuItemProps = $props();
</script>

<div role="menuitem" tabindex="0" aria-disabled={disabled} class={cn("flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground", disabled && "opacity-50 cursor-not-allowed", className)} onclick={() => !disabled && onclick?.()} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && onclick?.()}>
  {@render children?.()}
</div>


