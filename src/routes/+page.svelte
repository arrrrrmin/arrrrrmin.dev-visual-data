<script>
    import { intro } from "$lib/config.js";

    let { data } = $props();
</script>

<div class="text-lg md:max-w-[50%]">
    <p>
        {intro}
    </p>
    <p>
        Anfang 2025 habe ich begonnen, mein Datenvisualisierungs-Hobby etwas
        intensiver zu betreiben. Diese Webseite ist ein Versuch, Anschluss an
        die Datenvisualisierungs-Community zu finden. Gleichzeitig ist sie ein
        Raum für Experimente.
    </p>
    <p>
        Für den Titel der Seite kann ich nichts, mir war wirklich nix besseres
        eingefallen.
    </p>
    <div class="pt-4">
        <a href="/about" class="hover:text-stone-500 underline"
            ><h3 class="text-lg">Über mich</h3></a
        >
    </div>
</div>
<div class="py-8 md:max-w-[80%]">
    <div
        class="grid grid-flow-row grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 [grid-auto-rows:1fr]"
    >
        {#each data.visuals as visual (visual.id)}
            <section
                class="relative group overflow-hidden rounded-sm bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                class:col-span-2={visual.size === "big" ||
                    visual.size === "wide"}
                class:row-span-2={visual.size === "big" ||
                    visual.size === "tall"}
            >
                <div class="relative w-full h-0 pb-[100%]">
                    {#if visual.slug}
                        <a
                            href={`visuals/${visual.slug}`}
                            class="absolute inset-0"
                        >
                            {#if visual.preview}
                                <img
                                    src={visual.preview.url}
                                    alt={visual.preview.alt}
                                    class="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-102"
                                    loading="lazy"
                                />
                            {:else}
                                <div
                                    class="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-102"
                                ></div>
                            {/if}
                        </a>
                    {:else}
                        <a
                            href={visual.link}
                            target="_blank"
                            class="absolute inset-0"
                        >
                            {#if visual.preview}
                                <img
                                    src={visual.preview.url}
                                    alt={visual.preview.alt}
                                    class="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-102"
                                    loading="lazy"
                                />
                            {:else}
                                <div
                                    class="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-102"
                                ></div>
                            {/if}
                        </a>
                    {/if}
                </div>

                <h2
                    class="absolute bottom-0 left-0 px-2 py-1 bg-stone-50 w-full text-base/5 font-sans font-semibold drop-shadow-md
           transition-transform duration-200 rounded-b-sm group-hover:scale-102"
                >
                    {visual.title}
                </h2>
            </section>
        {/each}
    </div>
</div>
