<script lang="ts" module>
  import { cn } from "$lib/utils.js";
  export type TableProps = { class?: string; children?: any };
</script>

<script lang="ts">
  let { class: className, children }: TableProps = $props();
</script>

<div class={cn("overflow-x-auto rounded-xl border bg-card", className)}>
  <table class="w-full text-sm">
    {@render children?.()}
  </table>
</div>


