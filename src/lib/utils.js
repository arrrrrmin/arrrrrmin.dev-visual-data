import * as d3 from "d3";
import visuals from "$lib/visuals.json";

/** */
export function getVisualInfo(slug) {
    return visuals.find((p) => p.slug === slug);
}


