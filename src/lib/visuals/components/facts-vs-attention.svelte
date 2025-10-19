<script>
    // <Factory slug={data.slug} data={visdata} />
    import { onMount } from "svelte";
    import * as d3 from "d3";

    let { data } = $props();

    const options = { id: "sm-freq" };

    let hashtag = "#miosga";
    let dataSelection = $state("Mastodon");
    let _data;

    const switchData = () => {
        if (dataSelection === "Mastodon") {
            dataSelection = "Bluesky";
            _data = data["bluesky-posts"];
        } else {
            dataSelection = "Mastodon";
            _data = data["mastodon-posts"];
        }
        _data = _data.map((d) => ({
            ...d,
            created_at: new Date(d.created_at),
        }));
    };

    switchData();

    const getButtonText = () => {
        if (dataSelection === "Bluesky") {
            return "Mastodon-Variante 👈";
        }
        return "Bluesky-Variante 👈";
    };

    const getTransitFactor = () => {
        return 2000 / _data.length;
    };

    let epstart = new Date(2025, 1, 2, 22, 15, 0, 0);
    let epend = new Date(2025, 1, 2, 23, 15, 0, 0);
    let epfc = new Date(2025, 1, 3, 16, 0, 0, 0);

    onMount(() => {
        const width = 1100;
        const height = 350;
        const margins = { top: 125, bottom: 30 };
        const animT = 500;

        const getXScale = () => {
            return d3.scaleTime(
                [
                    d3.timeDay.floor(
                        d3.min([d3.min(_data, (d) => d.created_at)]),
                    ),
                    d3.timeDay.ceil(
                        d3.max([d3.max(_data, (d) => d.created_at)]),
                    ),
                ],
                [0, width],
            );
        };

        const y = d3.scaleLinear(
            [0, 1],
            [height - margins.bottom, margins.top],
        );

        const svg = d3
            .select("div#sm-freq")
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("style", `max-width: ${width}px; overflow: visible;`);

        const title = svg
            .append("text")
            .attr("id", "sm-freq-title")
            .attr("font-size", 24)
            .attr("font-weight", 600)
            .attr("text-anchor", "middle");

        const gx = svg
            .append("g")
            .attr("transform", `translate(0,${height - margins.bottom})`);
        var switchButton = svg
            .append("g")
            .attr("id", "sm-freq-shift-data-g")
            .append("text")
            .attr("id", "sm-freq-shift-data-g-text")
            .attr("cursor", "pointer")
            .attr("x", width)
            .attr("y", 20)
            .attr("font-size", 20)
            .attr("fill", "gray")
            .attr("text-anchor", "end")
            .style("text-decoration", "underline")
            .on("mouseover", function (event) {
                d3.select("#sm-freq-shift-data-g-text").attr("fill", "black");
            })
            .on("mouseout", function (event) {
                d3.select("#sm-freq-shift-data-g-text").attr("fill", "gray");
            })
            .on("click", function (event) {
                switchData();
                update();
            });

        const grects = svg.append("g").attr("id", "sm-freq-grects");
        const gline = svg.append("g").attr("id", "sm-freq-gline");
        const gguidance = svg.append("g").attr("id", "sm-freq-guidance");

        const line = d3
            .line()
            .x((d) => d[0])
            .y((d) => d[1]);

        const update = () => {
            grects.selectAll("rect#sm-freq-grects-rect").remove();
            var x = getXScale();
            gx.call(
                d3
                    .axisBottom(x)
                    .ticks(d3.timeHour.every(6))
                    .tickFormat((d) => {
                        return d.getHours() === 0
                            ? d
                                  .toLocaleString("de-DE", {
                                      day: "numeric",
                                      month: "short",
                                  })
                                  .replace(".", "")
                            : d
                                  .toLocaleString("de-DE", {
                                      hour: "numeric",
                                  })
                                  .replace(" Uhr", "");
                    }),
            )
                .call((g) =>
                    g
                        .selectAll("g.tick text")
                        .attr("font-size", 18)
                        .attr("font-weight", 500)
                        .attr("font-weight", (d) =>
                            d.getHours() === 0 ? 600 : 400,
                        ),
                )
                .call((g) => g.select(".domain").remove());

            grects
                .selectAll("rect#sm-freq-grects-rect")
                .data(_data.sort((a, b) => a.created_at - b.created_at))
                .join("rect")
                .attr("id", "sm-freq-grects-rect")
                .attr("x", (d) => x(d.created_at))
                .attr("y", (d) => y(1))
                .attr("width", 1)
                .transition()
                .delay((_, i) => i * getTransitFactor())
                .ease(d3.easeBackOut)
                .attr("height", (d) => y(0) - y(1))
                .attr("fill", "black")
                .attr("fill-opacity", 0.5);

            gline
                .selectAll("path#sm-freq-gline-line-vert")
                .data([epstart, epend, epfc])
                .join("path")
                .attr("id", "sm-freq-gline-line-vert")
                .attr("d", (d) =>
                    line([
                        [x(d), y(0)],
                        [x(d), y(1) - margins.top / 2],
                    ]),
                )
                .attr("stroke", "#EF4444")
                .attr("stroke-width", 2)
                .style("stroke-dasharray", "2 1");

            gline
                .selectAll("text#sm-freq-gline-line-text")
                .data([
                    { date: epstart, text: "Ausstrahlung" },
                    { date: epfc, text: "Faktencheck veröffentlicht" },
                ])
                .join("text")
                .attr("id", "sm-freq-gline-line-text")
                .attr("x", (d) => x(d.date))
                .attr("y", y(1) - margins.top / 2)
                .attr("text-anchor", "start")
                .attr("font-size", 20)
                .attr("fill", "#EF4444")
                .text((d) => d.text);

            title
                .text(
                    `${_data.length} '${hashtag}'-Kommentare auf ${dataSelection}`,
                )
                .attr("x", width / 2)
                .attr("y", 20);

            switchButton.text(getButtonText());
        };
        update();
    });
</script>

<div id={options.id}></div>
