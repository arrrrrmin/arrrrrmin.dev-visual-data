import visuals from "$lib/visuals.json";

export const prerender = true;

export const load = async ({ params }) => {

    return {
        visuals: visuals,
    }
}
