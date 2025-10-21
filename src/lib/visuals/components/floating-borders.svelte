<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    let { data } = $props();

    const Colors = {
        dimGray: "#64625f",
        lightGray: "#E6E3E0",
        eminence: "#72327c",
        sienna: "#ed7d54",
        mustard: "#ffd76a",
        white: "#ffffff",
    };

    function fixWinding(feature) {
        if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
                (ring) => ring.slice().reverse(),
            );
        }
        if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
                (polygon) => polygon.map((ring) => ring.slice().reverse()),
            );
        }
        return feature;
    }

    onMount(() => {
        let _data = data.features.filter(
            (d) => !d.properties.cntry_name.includes("Russia"),
        );
        _data = _data.map((d) => fixWinding(d));
        _data = _data.sort(
            (a, b) => a.properties.gwsyear - b.properties.gwsyear,
        );

        let step = 0;
        let isRunning = false;
        let animationInterval = undefined;
        const transitionTime = 300;
        const width = 1000;
        const height = width * 0.7;
        const svg = d3
            .select("div#map-svg")
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("style", `max-width: ${width}px; overflow: visible;`)
            .on("click", function (_) {
                if (isRunning && animationInterval) {
                    isRunning = false;
                    hinter.attr("display", "block");
                    animationInterval.stop();
                } else {
                    step = doStep(step);
                    hinter.attr("display", "none");
                    isRunning = true;
                    animationInterval = d3.interval(
                        doAnimationStep,
                        transitionTime * 2,
                    );
                }
            });

        const hinter = svg
            .append("g")
            .attr("transform", `translate(${width - 150}, 40)`)
            .append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-align", "end")
            .text(!isRunning ? "Click to start/pause" : "");

        const projection = d3.geoMercator().fitExtent(
            [
                [20, 20],
                [width - 20, height - 20],
            ],
            {
                type: "FeatureCollection",
                features: _data,
            },
        );
        const path = d3.geoPath().projection(projection);

        const yLabelScale = d3
            .scaleBand()
            .domain(Array(18).keys())
            .range([height, 20])
            .padding(0.1);

        const glatest = svg.append("g").attr("z-index", 2);
        const gpast = svg.append("g").attr("z-index", 1);
        const gnames = svg.append("g").attr("transform", `translate(0, 0)`);

        glatest
            .selectAll("path#latest")
            .data([_data[step]])
            .join("path")
            .attr("id", "latest")
            .attr("fill", Colors.sienna)
            .attr("opacity", 0.85)
            .attr("stroke", Colors.dimGray)
            .attr("stroke-width", 1)
            .transition(transitionTime)
            .attr("d", path);

        gnames
            .selectAll("text")
            .data([_data[step]])
            .join("text")
            .attr("fill", Colors.dimGray)
            .attr("opacity", 0.85)
            .attr("x", (_, i) => i)
            .transition(transitionTime)
            .ease(d3.easePolyOut)
            .attr("y", (_, i) => yLabelScale(i))
            .attr("text-anchor", "start")
            .text(
                (d) =>
                    `${d.properties.cntry_name} (${d.properties.gwsyear}/${d.properties.gweyear})`,
            );

        function doAnimationStep() {
            let pathA = path(_data[step]);
            step = doStep(step);
            let pathB = path(_data[step]);

            const nLabels = 16;
            const labelStartInd = step > nLabels ? step - nLabels : 0;
            const textUpdate = gnames
                .selectAll("text")
                .data(_data.slice(labelStartInd, step + 1))
                .call((update) =>
                    update
                        .text(
                            (d) =>
                                `${d.properties.cntry_name} (${d.properties.gwsyear}/${d.properties.gweyear})`,
                        )
                        .transition(transitionTime / 2)
                        .delay(transitionTime / 4)
                        .ease(d3.easePolyOut)
                        .attr("y", (_, i) => yLabelScale(i))
                        .attr("fill", (_, i) =>
                            i == step - labelStartInd
                                ? Colors.sienna
                                : Colors.dimGray,
                        ),
                );

            textUpdate
                .enter()
                .append("text")
                .attr("fill", (_, i) =>
                    i == step - labelStartInd ? Colors.sienna : Colors.dimGray,
                )
                .attr("x", 0)
                .attr("y", -30)
                .attr("text-anchor", "start")
                .text(
                    (d) =>
                        `${d.properties.cntry_name} (${d.properties.gwsyear}/${d.properties.gweyear})`,
                )
                .call((enter) =>
                    enter
                        .transition(transitionTime / 2)
                        .ease(d3.easePolyOut)
                        .attr("y", (_, i) => yLabelScale(i)),
                );

            textUpdate
                .exit()
                .attr("fill", "brown")
                .call((exit) =>
                    exit
                        .transition(transitionTime / 2)
                        .delay(transitionTime / 4)
                        .ease(d3.easePolyOut)
                        .attr("y", 30)
                        .remove(),
                );

            glatest
                .selectAll("path#latest")
                .attr("z-index", step)
                .attr("fill", Colors.sienna)
                .attr("opacity", 0.85)
                .attr("stroke", Colors.dimGray)
                .transition(transitionTime)
                .ease(d3.easePolyOut)
                .attrTween("d", function () {
                    const i = d3.interpolateString(pathA, pathB);
                    return (t) => i(t);
                });

            gpast
                .selectAll("path#past")
                .data(filterByGWSEnd(_data.slice(0, step)))
                .join("path")
                .attr("id", "past")
                .attr("fill", "none")
                .attr("stroke", Colors.dimGray)
                .attr("z-index", (_, i) => i)
                .attr("d", path);
        }

        function doStep(step) {
            if (step < _data.length - 1) {
                step = step + 1;
            } else {
                step = 0;
            }
            return step;
        }

        function filterByGWSEnd(dataContext) {
            const currentYear = _data[step].properties.gwsyear;
            return dataContext.filter(
                (d) => d.properties.gweyear >= currentYear,
            );
        }
    });
</script>

<div id="map-svg"></div>
