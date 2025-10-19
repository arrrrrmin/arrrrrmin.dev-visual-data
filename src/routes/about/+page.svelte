<script>
    import { intro, expertise } from "$lib/config.js";

    let { data } = $props();
</script>

<div class="md:max-w-[50%]">
    <p class="text-lg">
        {intro}
    </p>
    <p class="text-lg">
        Anfang 2025 habe ich begonnen, mein Datenvisualisierungs-Hobby etwas
        intensiver zu betreiben. Diese Webseite ist ein Versuch, Anschluss an
        die Datenvisualisierungs-Community zu finden. Gleichzeitig ist sie ein
        Raum für Experimente.
    </p>
    <p class="text-lg">
        Für den Titel der Seite kann ich nichts, mir war wirklich nix besseres
        eingefallen.
    </p>
</div>
<div class="pt-8 md:max-w-[75%]">
    <h2 class="pb-2 text-2xl font-serif">Womit ich gerne arbeite</h2>
    <ol class="ml-5 list-disc text-lg">
        {#each expertise as ex}
            <li>
                <a
                    href={ex.url}
                    class="hover:text-stone-500 underline mr-1"
                    target="_blank">{ex.name}</a
                ><span class="ml-2">{ex.comment}</span>
            </li>
        {/each}
    </ol>
</div>
<div class="pt-8 md:max-w-[50%]">
    <h2 class="pb-2 text-2xl font-serif">Wer ich bin</h2>
    <p class="text-lg">
        Mein vollständiger Name ist Armin Müller-von Fischer, 34 Jahre alt und
        bin gerade in Tübingen. Als CCC-affines Datenmenschlein versuche ich
        etwas Anschluss an die Datenvisualisierungs-Community zu finden. Meine
        ersten Schritte habe ich mit den Projekten auf dieser Webseite gemacht.
    </p>
</div>
<div class="pt-8">
    <h2 class="pb-2 text-2xl font-serif">Kontakt</h2>
    <p class="text-lg">
        Wenn Sie mich kontaktieren wollen, kann ich folgende Möglichkeiten
        anbieten
    </p>
    <ol class="ml-5 list-disc text-lg">
        {#each data.profile.verified_accounts as acc}
            <li>
                <a
                    href={acc.url}
                    class="hover:text-stone-500 underline mr-1"
                    target="_blank">{acc.service_label}</a
                >
                <a href={acc.url} role="button" target="_blank">
                    <img
                        src={acc.service_icon}
                        alt={`${acc.service_label} social icon`}
                        class="inline-block size-6 fill-gray-800 rounded-sm outline -outline-offset-1 outline-black/5 hover:outline-black"
                    />
                </a>
            </li>
        {/each}
    </ol>
</div>
