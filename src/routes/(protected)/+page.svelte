<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Card from '$lib/components/ui/card/card.svelte';
    import Separator from '$lib/components/ui/separator/separator.svelte';
    import ArrowDown from '@lucide/svelte/icons/arrow-down';
    import ArrowUp from '@lucide/svelte/icons/arrow-up';
    import Phone from '@lucide/svelte/icons/phone';
    import Clock from '@lucide/svelte/icons/clock';
    import FileText from '@lucide/svelte/icons/file-text';
    import Info from '@lucide/svelte/icons/info';
    import User2 from '@lucide/svelte/icons/user-2';
    import PhoneCall from '@lucide/svelte/icons/phone-call';
    import Plus from '@lucide/svelte/icons/plus';
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    const stats = [
        { label: 'Jobs in Progress', value: 3, trend: 'down', color: 'text-red-500' },
        { label: 'Proposals Sent', value: 5, trend: 'up', color: 'text-blue-500' },
        { label: 'Pending Payments', value: 6, trend: 'up', color: 'text-blue-500' }
    ];

    const todays = [
        { icon: Phone, text: 'Follow up: Sarah L.' },
        { icon: Clock, text: "9:00 AM – Inspection at John’s House" },
        { icon: FileText, text: 'Send Proposal: Mike T.' }
    ];

    const leads = [
        {
            name: 'FERNANDO JAMES',
            addressLine1: 'St. 1, A.B.C. X.Y.Z.',
            phone: '+9234587323',
            source: 'Via Outreach (Oct 1, 2025)',
            isNew: true
        },
        {
            name: 'FERNANDO JAMES',
            addressLine1: 'St. 1, A.B.C. X.Y.Z.',
            phone: '+9234587323',
            source: 'Via Outreach (Oct 1, 2025)',
            isNew: true
        }
    ];

    function pad2(n: number) {
        return n.toString().padStart(2, '0');
    }
</script>

<svelte:head>
    <title>Dashboard</title>
    <meta name="description" content="Roofing software dashboard" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preload" as="image" href="/favicon.svg" />
    
</svelte:head>

<div class="flex flex-col gap-6 w-full">
    <h1 class="text-3xl font-extrabold tracking-tight">DASHBOARD</h1>

    {#if $page.data.user?.role === 'OWNER'}
        <div class="flex justify-end">
            <Button class="gap-2" href="/members">
                <Plus class="size-4" />
                Add Members
            </Button>
        </div>
    {/if}

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {#each stats as s}
            <Card class="p-6 flex items-center justify-between">
                <div class="flex flex-col items-center justify-center w-full gap-1">
                    <div class="flex items-center gap-2 text-5xl font-extrabold tabular-nums">
                        {pad2(s.value)}
                        {#if s.trend === 'down'}
                            <ArrowDown class={`size-6 ${s.color}`} />
                        {:else}
                            <ArrowUp class={`size-6 ${s.color}`} />
                        {/if}
                    </div>
                    <Separator class="my-2" />
                    <div class="text-muted-foreground text-lg font-medium">
                        {s.label}
                    </div>
                </div>
            </Card>
        {/each}
    </div>

    <!-- Today's -->
    <Card>
        <div class="px-6 py-4 text-center text-2xl font-bold">Today's</div>
        <div class="px-6 pb-4">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-10">
                {#each todays as item}
                    <div class="flex items-center gap-3">
                        <item.icon class="size-5 text-red-500" />
                        <span class="text-sm md:text-base">{item.text}</span>
                    </div>
                {/each}
            </div>
        </div>
    </Card>

    <!-- Trending Leads -->
    <Card>
        <div class="px-6 py-4 text-2xl font-bold">Trending Leads</div>

        <div class="divide-y">
            {#each leads as lead}
                <div class="px-4 md:px-6 py-4">
                    <Card class="border bg-background">
                        <!-- top row -->
                        <div class="flex items-center justify-between px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="size-10 rounded-full border flex items-center justify-center text-muted-foreground bg-secondary/50">
                                    <User2 class="size-6" />
                                </div>
                                <div>
                                    <div class="text-sm font-semibold tracking-wide">{lead.name}</div>
                                    <div class="text-xs text-muted-foreground">{lead.addressLine1}</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                {#if lead.isNew}
                                    <span class="text-[10px] font-semibold px-2 py-1 rounded border bg-accent">
                                        NEW
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <!-- bottom row -->
                        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t px-4 py-3">
                            <div class="flex items-center gap-2 text-sm">
                                <PhoneCall class="size-4 text-muted-foreground" />
                                <a href={`tel:${lead.phone}`} class="font-semibold">{lead.phone}</a>
                            </div>

                            <div class="flex items-center gap-2 text-sm text-muted-foreground">
                                <Info class="size-4" />
                                <span>{lead.source}</span>
                            </div>

                            <div class="flex items-center gap-3">
                                <Button variant="outline" class="h-8">
                                    <Plus class="size-4" />
                                    Add to Watchlist
                                </Button>
                                <Button variant="outline" class="h-8">
                                    Details
                                    <ChevronRight class="size-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            {/each}
        </div>
    </Card>
</div>
