<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { size = 'md', class: className = '' }: Props = $props();

	const sizeClasses = {
		sm: 'size-4 border-2',
		md: 'size-6 border-2',
		lg: 'size-8 border-3'
	};
</script>

<div
	class="animate-spin rounded-full border-solid border-current border-t-transparent text-primary/80 {sizeClasses[size]} {className}"
	role="status"
	aria-label="loading"
></div>
