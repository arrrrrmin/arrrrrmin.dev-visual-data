<script>
    const { slug, data } = $props();
    let Component = $state(undefined);

    $effect(async () => {
        if (!slug) return;

        Component =
            (slug === "facts-vs-attention" &&
                (await import("./components/facts-vs-attention.svelte"))
                    .default) ||
            (slug === "fds-consultants-db" &&
                (await import("./components/fds-consultants-db.svelte"))
                    .default) ||
            (slug === "floating-borders" &&
                (await import("./components/floating-borders.svelte"))
                    .default) ||
            (slug === "bsky-tags-talkshows" &&
                (await import("./components/bsky-tags-talkshows.svelte"))
                    .default) ||
            (await import("./blank.svelte")).default;
    });
</script>

<div class="lg:max-w-[75%]">
    <div
        class="p-6 text-base font-sans bg-stone-100 overflow-clip rounded-lg border-1 border-stone-200"
    >
        {#if Component}
            <Component {data}></Component>
        {:else}
            <p>Loading visualization...</p>
        {/if}
    </div>
</div>
