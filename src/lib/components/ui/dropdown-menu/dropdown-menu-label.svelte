<script lang="ts" module>
  export type DropdownMenuLabelProps = { children?: any };
</script>

<script lang="ts">
  let { children }: DropdownMenuLabelProps = $props();
</script>

<div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
  {@render children?.()}
</div>


