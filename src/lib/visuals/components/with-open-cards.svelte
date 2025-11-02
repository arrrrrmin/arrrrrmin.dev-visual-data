<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";
    import * as topojson from "topojson";

    let container;
    let tooltip;
    let svg;
    let currentTransform = d3.zoomIdentity;
    let { data } = $props(); // This loads an array [arte-data, topomap]

    let containerWidth = $state(undefined);
    let selected = $state(undefined);
    let tooltipData = $state(undefined);

    const countrymap = topojson.merge(
        data[1],
        data[1].objects.countries.geometries,
    );
    const countryfeatures = topojson.feature(
        data[1],
        data[1].objects.countries,
    ).features;

    function getCountry(lon, lat, name) {
        const point = [lon, lat]; // Turn around, since d3 uses (lon,lat) not (lat,lon)
        for (const country of countryfeatures) {
            if (d3.geoContains(country, point)) {
                return country.properties.name;
            }
        }
        return name ? name : "Unknown";
    }

    function getCountryCentroid() {
        const location2country = new Map();
        for (const { origin, originCoords } of locations) {
            const [lon, lat] = originCoords;

            const country = getCountry(lon, lat, origin);
            if (country !== origin) {
                location2country.set(
                    origin,
                    d3.geoCentroid(
                        countryfeatures.find(
                            (f) => f.properties.name === country,
                        ),
                    ),
                );
            }
        }
        return location2country;
    }

    function getLineData() {
        const connections = data[0].connections;
        let links = connections.map((c) => {
            const [oLat, oLon] = c.origin_coords;
            const [tLat, tLon] = c.target_coords;
            const originCountry = getCountry(oLon, oLat, c.origin);
            const targetCountry = getCountry(tLon, tLat, c.target);
            const originCountryCoords = location2country.get(c.origin); // These are returned reversed
            const targetCountryCoords = location2country.get(c.target); // These are returned reversed
            return {
                ...c,
                originCoords: [oLon, oLat], // We can reverse them for later
                originCountry: originCountry,
                originCountryCoords: originCountryCoords,
                targetCooords: [tLon, tLat], // We can reverse them for later
                targetCountry: targetCountry,
                targetCountryCoords: targetCountryCoords,
                paths: [
                    [oLon, oLat],
                    originCountryCoords,
                    targetCountryCoords,
                    [tLon, tLat],
                ].filter((p) => p !== undefined),
            };
        });
        return links;
    }

    function resetHighlight() {
        d3.selectAll(".location").attr("class", "location");
        d3.selectAll(".link").attr("class", "link");
    }

    function showToolip(_event, d) {
        // const episodes = locations.filter((loc) => loc.origin === d.origin)
        if (tooltipData && tooltipData.origin === d.origin)
            tooltipData = undefined;
        else
            tooltipData = {
                origin: d.origin,
                episodes: data[0].lookup_by_name[d.origin].episodes,
            };
    }

    function hideTooltip(_event) {
        tooltipData = undefined;
        selected = undefined;
        resetHighlight();
    }

    const locations = [...Object.entries(data[0].lookup_by_name)].map(
        ([key, obj]) => ({
            origin: key,
            originCoords: obj.origin_coords.slice().reverse(),
            originCount: obj.episodes.length,
            episodes: obj.episodes,
        }),
    );
    const location2country = getCountryCentroid();
    const links = getLineData();

    let r = d3.scaleLinear(
        d3.extent(locations.map(({ originCount }) => originCount)),
        [1.8, 6.8],
    );

    onMount(() => {
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        containerWidth = width;

        const height = width * 0.66;

        const projection = d3
            .geoEquirectangular()
            .fitSize([width, height], countrymap);

        const currentScale = projection.scale();
        projection.scale(currentScale * 1.4);

        const path = d3.geoPath().projection(projection);

        const link = d3
            .line()
            .x((d) => d[0])
            .y((d) => d[1])
            .curve(d3.curveBundle.beta(0.9));

        const map = d3
            .select(svg)
            .attr("viewBox", [0, 0, width, height])
            .append("g")
            .attr("id", "map");

        function zoomed(event) {
            const { transform } = event;
            // const scale = transform.k;

            // const maxX = width * (scale - 1);
            // const maxY = height * (scale - 1);
            // const x = Math.min(0, Math.max(transform.x, -maxX));
            // const y = Math.min(0, Math.max(transform.y, -maxY));
            // map.attr("transform", `translate(${x},${y}) scale(${scale})`);

            map.attr("transform", transform);
        }

        const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

        d3.select(svg).call(zoom);

        map.append("path")
            .datum(countrymap)
            .attr("d", path)
            .attr("id", "basemap")
            .attr("class", "land");

        map.append("path")
            .datum(
                topojson.mesh(
                    data[1],
                    data[1].objects.countries,
                    (a, b) => a !== b,
                ),
            )
            .attr("class", "country-interior")
            .attr("d", path);

        const lines = map.append("g").attr("id", "lines");
        lines
            .selectAll("path")
            .data(links) // {..., paths: [originCoords, originCountryCoords, targetCountryCoords, targetCoords]}
            .join("path")
            .attr("d", (d) => link(d.paths.map((p) => projection(p))))
            .attr("class", "link");

        function highlightConnections(d) {
            const connected = links.filter(
                (l) => l.origin === selected || l.target === selected,
            );
            let targets = connected.map((d) => d.target);
            let origins = connected.map((d) => d.origin);
            d3.selectAll(".location").attr("class", (loc) => {
                return targets.includes(loc.origin) ||
                    origins.includes(loc.origin)
                    ? "location location-highlight"
                    : "location";
            });
            d3.selectAll(".link").attr("class", (l) => {
                return l.origin === selected || l.target === selected
                    ? "link link-highlight"
                    : "link";
            });
        }

        const dots = map.append("g").attr("id", "dots");
        dots.selectAll("circle")
            .data(locations) // {originCounts, originCoords}
            .join("circle")
            .attr("cx", ({ originCoords }) => projection(originCoords)[0])
            .attr("cy", ({ originCoords }) => projection(originCoords)[1])
            .attr("r", ({ originCount }) => r(originCount))
            .attr("class", "location")
            .on("click", function (e, d) {
                resetHighlight();
                if (selected === d.origin) {
                    selected = undefined;
                    hideTooltip();
                } else {
                    selected = d.origin;
                    highlightConnections(d);
                    showToolip(e, d);
                }
            })
            .on("mouseover", function (e, d) {});
    });

    $effect(() => {
        console.log(containerWidth);
    });
</script>

<div bind:this={container} class="relative block bg-[#8ecae6] rounded-md">
    <div
        bind:this={tooltip}
        class={tooltipData
            ? "absolute left-0 top-0 z-10 bg-white sm:m-1 p-1 sm:p-2 max-w-full md:max-w-92 rounded-md"
            : "hidden absolute left-0 top-0 z-10 bg-white sm:m-1 p-1 sm:p-2 max-w-full md:max-w-92 rounded-md"}
    >
        {#if tooltipData}
            <div class="flex justify-between pb-1">
                <div>
                    <h3 class="text-base font-semibold">
                        {#if tooltipData.episodes.length > 1}
                            {`${tooltipData.episodes.length} Episoden 'Mit offenen Karten' für ${tooltipData.origin}`}
                        {:else}
                            <a
                                href={tooltipData.episodes[0].source}
                                target="_black"
                                class="hover:text-[#fa481c] underline"
                                >{`${tooltipData.episodes[0].title}`}</a
                            >
                        {/if}
                    </h3>
                </div>
                <div>
                    <button
                        class="hover:fill-[#fa481c]"
                        onclick={(e) => hideTooltip(e)}
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="size-6"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="flex flex-col gap-y-1">
                {#if tooltipData.episodes.length > 1}
                    <div class="pb-1">
                        <em class="text-sm">{tooltipData.origin}</em>
                    </div>
                    {#each tooltipData.episodes as episode}
                        <div class="text-sm">
                            <a
                                href={episode.source}
                                target="_black"
                                class="hover:text-[#fa481c] underline"
                                >{episode.title.replace(
                                    "Mit offenen Karten - ",
                                    "",
                                )}</a
                            >
                        </div>
                    {/each}
                {:else}
                    <div class="pb-1">
                        <em class="text-sm">{tooltipData.origin}</em>
                    </div>
                    <div class="pb-1">
                        <p class="text-sm">
                            {tooltipData.episodes[0].description}
                        </p>
                    </div>
                    <div>
                        <img
                            src={tooltipData.episodes[0].preview.replace(
                                /\/1920x1080/,
                                "/380x214",
                            )}
                            alt=""
                            class="rounded-md"
                        />
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    <svg bind:this={svg} class="block rounded-lg" style="cursor: pointer;"
    ></svg>
</div>

<style lang="css">
    :root {
        --arte-red: #fa481c;
        --dark-blue: #3d405b;
        --light-brown: #f4f1de;
    }

    :global(.land) {
        fill: var(--light-brown);
        stroke: var(--dark-blue);
        stroke-opacity: 0.5;
        stroke-width: 0.5px;
    }

    :global(.country-interior) {
        fill: none;
        stroke: var(--dark-blue);
        stroke-opacity: 0.5;
        stroke-width: 0.5px;
    }

    :global(.location) {
        fill: var(--dark-blue);
        opacity: 1;
    }

    :global(.location-highlight) {
        fill: var(--arte-red);
    }

    :global(.link) {
        mix-blend-mode: none;
        fill: none;
        stroke: var(--dark-blue);
        opacity: 0.05;
    }

    :global(.link-highlight) {
        mix-blend-mode: none;
        stroke: var(--arte-red);
        opacity: 1;
    }
</style>
