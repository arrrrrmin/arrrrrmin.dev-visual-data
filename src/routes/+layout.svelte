<script>
	import "../app.css";
	import * as config from "$lib/config.js";
	import visuals from "$lib/visuals.json";

	const year = new Date().getFullYear();
</script>

<svelte:head>
	<link rel="icon" href={`https://${config.domain}/favicon/favicon.svg`} />
	<link rel="me" href="https://chaos.social/@arrrrrmin" />
	<meta name="fediverse:creator" content="@arrrrrmin@chaos.social" />
	<meta name="description" content={config.intro} />
	<meta name="author" content="Armin Müller-von Fischer" />
	<meta name="language" content="de" />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={`https://${config.domain}`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={config.title} />
	<meta property="og:description" content={config.intro} />
	<meta property="og:url" content={`https://${config.domain}`} />
	<meta
		property="og:image"
		content={`https://${config.domain}/favicon/web-app-manifest-512x512.png`}
	/>
	<meta name="theme-color" content="#FBBF24">
</svelte:head>

<div class="font-serif">
	<header
		class="fixed px-4 sm:px-8 py-4 left-0 top-0 bg-stone-50 min-w-full border-b-1 border-stone-200 z-10"
	>
		<a href="/" class="hover:text-stone-500 hover:underline"
			><h1 class="text-lg">{config.title}</h1></a
		>
	</header>
	<!-- <main class="pt-16 md:grid md:grid-cols-4 md:gap-y-4"> -->
	<main class="pt-8">
		<!--
		<div
			class="order-1 col-span-1 md:order-2 sm:border-b-1 md:border-b-0 md:border-l-1"
		>
			<div class="flex flex-col md:pl-4 gap-y-2">
				{#each visuals as v}
					<div>
						<a
							href={`/visuals/${v.slug}`}
							class="hover:text-stone-500 hover:underline whitespace-nowrap"
						>
							{v.title}
						</a>
					</div>
				{/each}
			</div>
		</div>
		-->
		<div class="order-2 col-span-3 md:order-1 pt-12 px-4 sm:px-8">
			<slot />
		</div>
	</main>
	<footer
		class="mt-12 px-4 sm:px-8 py-4 lg:flex lg:justify-between bg-stone-50 min-w-full border-t-1 border-stone-200 z-10"
	>
		<div>
			{config.title}, build with
			{#each config.buildWith as link}
				<a
					class="hover:text-stone-500 underline mr-1"
					target="_blank"
					href={link.href}>{link.title}</a
				>
			{/each}
		</div>
		<div>© {year} Armin Müller-von Fischer. All rights reserved.</div>
	</footer>
</div>
