<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    let { data } = $props();

    const options = { id: "bdb-treemap" };

    let _data = data.filter((d) => d.ausgaben_jahr1_clean > 0);
    let consultancyNames = new Set(_data.map((d) => d.erstgen_auftragnehmer));

    let consultancyObj = d3
        .groups(_data, (c) => c.year)
        .map((C) => ({
            name: `${C[0]}`,
            year: C[0],
            children: d3
                .groups(C[1], (d) => d.ressort)
                .map((D) => ({
                    name: D[0],
                    ressort_label: D[1][0].ressort_label,
                    children: d3
                        .groups(D[1], (e) => e.erstgen_auftragnehmer)
                        .map((E) => ({
                            name: E[0],
                            children: E[1]
                                .map((f) => ({
                                    name: f.details_a,
                                    value: f.ausgaben_jahr1_clean,
                                    year: f.year,
                                }))
                                .sort((a, b) => b.value - a.value),
                        })),
                })),
        }));

    consultancyObj = {
        name: `Beraterdatenbank`,
        children: consultancyObj.sort((a, b) => a.year - b.year),
    };

    /** Copied from https://github.com/observablehq/stdlib/blob/main/src/dom/uid.js */
    var count = 0;
    function uid(name) {
        return new Id("O-" + (name == null ? "" : name + "-") + ++count);
    }
    function Id(id) {
        this.id = id;
        this.href = new URL(`#${id}`, location) + "";
    }
    Id.prototype.toString = function () {
        return "url(" + this.href + ")";
    };

    const readableNames = (d, limit = false) => {
        let result_str = d.data.name;
        const nameLimit = 35;

        if (result_str.length > nameLimit) {
            result_str = result_str.substr(0, nameLimit) + "...";
        }
        return result_str;
    };

    onMount(() => {
        const width = 1000;
        const height = 800;
        const margins = { left: 0, top: 120, right: 0, bottom: 2 };
        const gapSize = 8;
        const animDelay = 50;

        var svg = d3
            .select("#bdb-treemap")
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("style", `max-width: ${width}px; overflow: hidden;`);

        var visTitle = svg
            .append("g")
            .attr("id", "bdb-treemap-title-g")
            .append("text")
            .attr("id", "bdb-treemap-title-text")
            .attr("x", width / 2)
            .attr("y", margins.top / 2 - 24)
            .attr("font-size", 24)
            .attr("font-weight", 600)
            .attr("text-anchor", "middle")
            .text("Die Frag den Staat Beraterdatenbank (Mio./k)");

        function tile(node, x0, y0, x1, y1) {
            d3.treemapBinary(node, 0, 0, width, height - margins.top);
            for (const child of node.children) {
                child.x0 = x0 + (child.x0 / width) * (x1 - x0);
                child.x1 = x0 + (child.x1 / width) * (x1 - x0);
                child.y0 = y0 + (child.y0 / height) * (y1 - y0);
                child.y1 = y0 + (child.y1 / height) * (y1 - y0);
            }
        }

        // Compute the layout.
        const hierarchy = d3
            .hierarchy(consultancyObj)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value);
        const root = d3.treemap().tile(tile)(hierarchy);

        const x = d3.scaleLinear().rangeRound([2, width - 2]);
        const y = d3.scaleLinear().rangeRound([2, height - margins.bottom]);

        const format = d3.format(",d");

        const rootName = (d) => {
            return d
                .ancestors()
                .reverse()
                .map((d) => readableNames(d))
                .join("\t>\t");
        };

        const name = (d, root = false) => {
            return d
                .ancestors()
                .reverse()
                .map((d) =>
                    root ? readableNames(d).replaceAll(" ", "_") : d.data.name,
                )
                .join("-->");
        };

        const readableValue = (d) => {
            let return_str = d.value;
            if (d.value > 1e6) {
                return_str = `${(d.value / 1e6).toFixed(2)} M`;
            } else {
                return_str = `${(d.value / 1e3).toFixed(2)} k`;
            }
            return return_str;
        };

        let group = svg
            .append("g")
            .attr("transform", `translate(0,${margins.top})`)
            .call(render, root);

        function render(group, root) {
            const node = group
                .selectAll("g")
                .data(root.children.concat(root))
                .join("g");

            node.filter((d) => (d === root ? d.parent : d.children))
                .attr("cursor", "pointer")
                .on("click", (event, d) =>
                    d === root ? zoomout(root) : zoomin(d),
                );

            node.append("title").text((d) => `${name(d)}: ${readableValue(d)}`);

            node.append("rect")
                .attr("id", (d) => (d.leafUid = uid("leaf")).id)
                .attr("rx", 4)
                .attr("fill", "#fff")
                .attr("stroke", "#000")
                .attr("stroke-width", 2)
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("fill", "#007a55");
                    d3.select(`text#${d.clipUid.id}`).attr("fill", "#fff");
                })
                .on("mouseout", function (event, d) {
                    d3.select(this).attr("fill", "#fff");
                    d3.select(`text#${d.clipUid.id}`).attr(
                        "fill",
                        "current-color",
                    );
                });

            node.append("clipPath")
                .attr("id", (d) => (d.clipUid = uid("clip")).id)
                .append("use")
                .attr("xlink:href", (d) => d.leafUid.href);

            node.append("text")
                .attr("id", (d) => d.clipUid.id)
                .attr("clip-path", (d) => d.clipUid)
                .attr("font-weight", (d) => (d === root ? "bold" : null))
                .attr("font-size", 20)
                .selectAll("tspan")
                .data((d) =>
                    (d === root ? name(d, true) : readableNames(d, true))
                        .split(/(?<= )/g)
                        .concat(readableValue(d)),
                )
                .join("tspan")
                .attr("x", 3)
                .attr(
                    "y",
                    (d, i, nodes) =>
                        `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`,
                )
                .attr("fill-opacity", (d, i, nodes) =>
                    i === nodes.length - 1 ? 0.7 : null,
                )
                .attr("font-weight", (d, i, nodes) =>
                    i === nodes.length - 1 ? "normal" : null,
                )
                .text((d) => d);

            group.call(position, root);
        }

        function position(group, root) {
            group
                .selectAll("g")
                .attr("transform", (d) =>
                    d === root
                        ? `translate(2,-${margins.top / 2})`
                        : `translate(${x(d.x0)},${y(d.y0)})`,
                )
                .select("rect")
                .attr("width", (d) =>
                    d === root ? width - 4 : x(d.x1) - x(d.x0),
                )
                .attr("height", (d) =>
                    d === root ? margins.top / 2 : y(d.y1) - y(d.y0),
                );
        }

        // When zooming in, draw the new nodes on top, and fade them in.
        function zoomin(d) {
            const group0 = group.attr("pointer-events", "none");
            const group1 = (group = svg
                .append("g")
                .attr("transform", `translate(0,${margins.top})`)
                .call(render, d));

            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);

            svg.transition()
                .duration(500)
                .call((t) =>
                    group0.transition(t).remove().call(position, d.parent),
                )
                .call((t) =>
                    group1
                        .transition(t)
                        .attrTween("opacity", () => d3.interpolate(0, 1))
                        .call(position, d),
                );
        }

        // When zooming out, draw the old nodes on top, and fade them out.
        function zoomout(d) {
            const group0 = group.attr("pointer-events", "none");
            const group1 = (group = svg
                .insert("g", "*")
                .attr("transform", `translate(0,${margins.top})`)
                .call(render, d.parent));

            x.domain([d.parent.x0, d.parent.x1]);
            y.domain([d.parent.y0, d.parent.y1]);

            svg.transition()
                .duration(500)
                .call((t) =>
                    group0
                        .transition(t)
                        .remove()
                        .attrTween("opacity", () => d3.interpolate(1, 0))
                        .call(position, d),
                )
                .call((t) => group1.transition(t).call(position, d.parent));
        }
    });
</script>

<div id={options.id}></div>
