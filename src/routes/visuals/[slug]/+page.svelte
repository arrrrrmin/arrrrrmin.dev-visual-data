<script>
  import { onMount } from "svelte";
  import Factory from "$lib/visuals/factory.svelte";
  import FactsVsAttention from "$lib/visuals/components/facts-vs-attention.svelte";

  const { data } = $props();

  // 1️⃣, 2️⃣ Metadata and data for this visualisation from the load()
  let { visinfo, visdata, error } = $derived(data);
</script>

{#if !error && visinfo}
  <div class="max-w-full">
    <h2 class="text-4xl font-bold mb-2">{visinfo.title}</h2>
    <p class=" mb-6">{visinfo.description}</p>

    <!-- 3️⃣ Component & data as props -->
    <div class={visinfo.vissize === "big" ? "lg:max-w-full" : "lg:max-w-[75%]"}>
      <Factory slug={data.slug} data={visdata} />
    </div>
  </div>
{:else}
  <div class="text-center py-20 text-gray-500">Info not found.</div>
{/if}
