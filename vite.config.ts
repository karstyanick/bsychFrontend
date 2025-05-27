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
		}
	})
	],
	server: {
		host: '0.0.0.0',
		port: 5173
	}
});
