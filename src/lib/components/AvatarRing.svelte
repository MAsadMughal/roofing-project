<script lang="ts">
	interface Props {
		name: string;
		online?: boolean;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { name, online = false, size = 'md', class: className = '' }: Props = $props();

	// Generate clean 2-char uppercase initials
	const initials = $derived(
		name
			.trim()
			.split(/\s+/)
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase() || 'U'
	);

	const sizeClasses = {
		sm: 'size-8 text-xs',
		md: 'size-10 text-sm font-semibold',
		lg: 'size-12 text-base font-bold'
	};

	const dotSizes = {
		sm: 'size-2 -right-0.5 -bottom-0.5',
		md: 'size-2.5 right-0 bottom-0',
		lg: 'size-3 right-0.5 bottom-0.5'
	};
</script>

<div class="relative shrink-0 select-none {className}">
	<div
		class="flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/20 text-primary border border-primary/20 shadow-xs {sizeClasses[size]}"
	>
		{initials}
	</div>
	
	{#if online}
		<span
			class="absolute rounded-full bg-green-500 border-2 border-background ring-1 ring-black/5 {dotSizes[size]}"
			title="Online"
		></span>
	{/if}
</div>
