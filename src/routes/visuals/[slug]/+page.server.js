import * as d3 from "d3";
import { getVisualInfo } from "$lib/utils.js";

export const prerender = true;

async function fetchData({ url, type }) {
    if (!url) throw new Error("fetchData: Missing URL");
    if (!type) type = "json";

    switch (type) {
        case "csv":
            return await d3.csv(url);
        case "tsv":
            return await d3.tsv(url);
        case "json":
            return await d3.json(url);
        case "text":
            return await fetch(url).then((r) => r.text());
        default:
            throw new Error(`fetchData: Unsupported type '${type}'`);
    }
}

export const load = async ({ params }) => {

    const visinfo = getVisualInfo(params.slug);
    let visdata;
    let error;

    try {
        if (visinfo?.data) {
            if (Array.isArray(visinfo.data)) {
                // In case the data is an Array, we load from multiple sources
                visdata = await Promise.all(visinfo.data.map(async (entry) => await fetchData(entry)));
                error = undefined;
            } else {
                // Otherwise data is an object and we can load directly
                visdata = await fetchData(visinfo.data);
                error = undefined;
            }
        }
    } catch (err) {
        console.error("Data fetch failed:", err);
        error = "Failed to load data.";
        visdata = undefined;
    }

    return {
        slug: params.slug, visdata: visdata, visinfo: visinfo, error: error,
    }
}