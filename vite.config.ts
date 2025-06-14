import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(),
	VitePWA({
		registerType: 'autoUpdate',
		manifest: {
			name: 'Bsych',
			short_name: 'Bsych',
			start_url: '/',
			display: 'standalone',
			background_color: '#ffffff',
			theme_color: '#000000',
			icons: [
				{
					src: '/icon-192.png',
					sizes: '192x192',
					type: 'image/png'
				},
				{
					src: '/icon-512.png',
					sizes: '512x512',
					type: 'image/png'
				}
			]
		},
		/* --- Assets that should be copied verbatim into /build --- */
		includeAssets: ['favicon.ico', 'robots.txt'],
		workbox: {
			// 1️⃣  Activate the new SW immediately after install
			skipWaiting: true,
			clientsClaim: true,

			// 2️⃣  Drop old precache entries that aren’t in the new build
			cleanupOutdatedCaches: true,

			// 3️⃣  Never treat real asset requests as navigations
			//     (prevents HTML being cached under JS chunk URLs)
			navigateFallback: '/index.html',
			navigateFallbackDenylist: [
				/^\/_app\//,            // SvelteKit chunks & assets
				/^\/assets\//,          // any custom static dir you may add
				/\/favicon\.ico$/,
				/\/robots\.txt$/
			]
		}
	})
	],
	server: {
		host: '0.0.0.0',
		port: 5173
	}
});
