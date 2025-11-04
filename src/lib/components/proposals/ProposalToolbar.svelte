<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';
	import Download from '@lucide/svelte/icons/download';
	import { iconColor } from '$lib/utils/proposals';
	
	export let searchText: string;
	export let statusFilter: string;
	export let sortBy: string;
	export let role: string | null;
	export let onCreateClick: () => void = () => {};
	export let onExportClick: () => void = () => {};
</script>

<div class="mb-6 flex flex-wrap items-center gap-3 px-1">
	<div class="relative min-w-64 grow">
		<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
		<Input
			placeholder="Search proposals..."
			bind:value={searchText}
			class="pl-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary"
		/>
	</div>
	<Select
		class="min-w-40 rounded-lg bg-slate-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 border-slate-200 dark:border-slate-600"
		bind:value={statusFilter}
		items={[
			{ value: 'All', label: 'All statuses' },
			{ value: 'Draft' },
			{ value: 'Sent' },
			{ value: 'Viewed' },
			{ value: 'Approved' },
			{ value: 'Declined' },
			{ value: 'Expired' }
		]}
	/>
	<Select
		class="min-w-40 rounded-lg bg-slate-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 border-slate-200 dark:border-slate-600"
		bind:value={sortBy}
		items={[{ value: 'Newest' }, { value: 'Oldest' }, { value: 'Amount' }, { value: 'Client' }]}
	/>
	{#if role !== 'OWNER'}
		<Button
			class="ml-auto h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-none transition-colors"
			onclick={onCreateClick}
		>
			<Plus class={"size-4 mr-2 " + iconColor('new')} /> New Proposal
		</Button>
	{/if}
	<Button
		variant="outline"
		class="h-10 rounded-full border border-slate-300 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-none"
		onclick={onExportClick}
	>
		<Download class={"size-4 mr-2 " + iconColor('pdf')} />
		Export CSV
	</Button>
</div>

