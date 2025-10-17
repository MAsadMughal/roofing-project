<script lang="ts">
    import * as Select from './index.js';

    let {
        items = [] as Array<{ value: string; label?: string }>,
        value = $bindable<string | null>(null),
        name,
        placeholder = 'Select...',
        class: className
    } = $props();
</script>

<Select.Root type="single" {name} bind:value>
    <Select.Trigger class={className}>
        {#if value}
            {items.find((i) => i.value === value)?.label ?? String(value)}
        {:else}
            {placeholder}
        {/if}
    </Select.Trigger>
    <Select.Content>
        <Select.Group>
            {#each items as it (it.value)}
                <Select.Item value={it.value} label={it.label ?? it.value}>
                    {it.label ?? it.value}
                </Select.Item>
            {/each}
        </Select.Group>
    </Select.Content>
    
</Select.Root>


