<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    let { data } = $props();

    const options = { id: "hashtag-circle" };
    const Colors = {
        dimGray: "#64625f",
        lightGray: "#E6E3E0",
        eminence: "#72327c",
        sienna: "#ed7d54",
        mustard: "#ffd76a",
        white: "#ffffff",
    };

    function uniformTag(tag) {
        const t = tag.toLowerCase();
        return String(t).charAt(0).toUpperCase() + String(t).slice(1);
    }

    function rearrangeData(data) {
        let _data = data.map((d) => ({ ...d, tag: uniformTag(d.tag) }));
        let filteredTags = d3
            .groups(_data, (d) => d.tag)
            .map(([tag, tag_grp]) => ({ tag: tag, count: tag_grp.length }))
            .filter((d) => d.count > 1)
            .map((d) => d.tag);
        _data = _data.filter((d) => filteredTags.includes(d.tag));
        let tag = new Array(...new Set(_data.map((d) => d.tag)));
        let tagChildren = [];

        tag.forEach((t) => {
            const children = _data.filter((D) => D.tag == t);
            const childActivityIds = new Array(
                ...new Set(children.map((d) => d.activity_id)),
            );
            tagChildren.push({
                name: t,
                relations: new Array(
                    ...new Set(
                        _data
                            .filter(
                                (d) =>
                                    childActivityIds.includes(d.activity_id) &&
                                    d.tag != t,
                            )
                            .map((d) => d.tag),
                    ),
                ),
            });
        });
        return {
            name: "TagHierachy",
            children: tagChildren.sort((a, b) => b.name.localeCompare(a.name)),
            //children: tagChildren.sort((a, b) => b.relations.length - a.relations.length),
        };
    }

    function id(node) {
        // return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
        return `${node.data.name}`;
    }

    function bilink(root) {
        const map = new Map(root.leaves().map((d) => [id(d), d]));
        for (const d of root.leaves())
            (d.incoming = []),
                (d.outgoing = d.data.relations.map((i) => [d, map.get(i)]));
        // for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
        return root;
    }

    onMount(() => {
        let _data = rearrangeData(data);
        const width = 800;
        const radius = width / 2;
        const tree = d3.cluster().size([2 * Math.PI, radius - 120]);

        const root = tree(bilink(d3.hierarchy(_data)));
        const svg = d3
            .select(`div#${options.id}`)
            .append("svg")
            .attr("viewBox", [-width / 2, -width / 2, width, width])
            .attr("style", `max-width: ${width}px; overflow: visible;`);

        const node = svg
            .append("g")
            .selectAll()
            .data(root.leaves())
            .join("g")
            .attr(
                "transform",
                (d) =>
                    `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`,
            )
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", (d) => (d.x < Math.PI ? 6 : -6))
            .attr("font-size", 12)
            .attr("fill", Colors.dimGray)
            .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
            .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
            .attr("cursor", "pointer")
            .text((d) => d.data.name)
            .each(function (d) {
                d.text = this;
            })
            //.on("click", clicked);
            .on("mouseover", hovered)
            .on("mouseout", unhovered);

        const line = d3
            .lineRadial()
            .curve(d3.curveBundle.beta(0.2))
            .radius((d) => d.y)
            .angle((d) => d.x);

        const link = svg
            .append("g")
            // .attr("stroke-dasharray", "3 1")
            .attr("fill", "none")
            .selectAll()
            .data(root.leaves().flatMap((leaf) => leaf.outgoing))
            .join("path")
            .attr("stroke", Colors.lightGray)
            .style("mix-blend-mode", "multiply")
            .attr("d", ([i, o]) => line(i.path(o)))
            .each(function (d) {
                d.path = this;
            });

        function clicked(event, d) {
            if (d3.select(this).attr("font-weight") == "bold") {
                d3.select(this).attr("font-weight", "normal");
                d3.selectAll(d.outgoing.map((d) => d.path)).attr(
                    "stroke",
                    Colors.lightGray,
                );
                d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr(
                    "font-weight",
                    undefined,
                );
            } else {
                d3.select(this).attr("font-weight", "bold");
                d3.selectAll(d.outgoing.map((d) => d.path))
                    .attr("stroke", Colors.sienna)
                    .raise();
                d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr(
                    "font-weight",
                    "bold",
                );
            }
        }

        function hovered(event, d) {
            link.style("mix-blend-mode", null);
            d3.selectAll(d.outgoing.map((d) => d.path))
                .attr("stroke", Colors.dimGray)
                .raise();
            d3.selectAll(d.outgoing.map(([, d]) => d.text))
                .attr("font-weight", "bold")
                .attr("fill", Colors.sienna)
            d3.select(this)
                .attr("font-weight", "bold")
                .attr("fill", Colors.sienna)
        }

        function unhovered(event, d) {
            link.style("mix-blend-mode", "multiply");
            d3.selectAll(d.outgoing.map((d) => d.path)).attr(
                "stroke",
                Colors.lightGray,
            );
            d3.selectAll(d.outgoing.map(([, d]) => d.text))
                .attr("font-weight", "none")
                .attr("fill", Colors.dimGray)
            d3.select(this)
                .attr("font-weight", "normal")
                .attr("fill", Colors.dimGray)
        }
    });
</script>

<div id={options.id}></div>
