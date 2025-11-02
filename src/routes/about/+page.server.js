import { gravatarId } from "$lib/config.js";


export const prerender = true;

export const load = async ({ params }) => {
    const profile = await fetch(gravatarId).then(d => d.json());
    return { profile: profile }
}
