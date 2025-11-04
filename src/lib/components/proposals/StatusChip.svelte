<script lang="ts">
	import { statusChipClass, toTitleCase } from '$lib/utils/proposals';
	
	export let status: string;
</script>

<span class="status-chip border {statusChipClass(toTitleCase(status))}">
	{toTitleCase(status)}
</span>

<style>
	.status-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		font-size: 0.87rem;
		font-weight: 600;
		border-radius: 9999px;
		padding: 0.21em 0.9em;
		text-transform: capitalize;
		letter-spacing: 0.01em;
		position: relative;
		transition: background 0.14s, border 0.14s, color 0.14s;
		box-shadow: 0 1px 2px 0 #0000, 0 1.5px 4px 0 #0001;
	}
</style>

