<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-sky-50 via-rose-50 to-violet-50 text-gray-800">
	{@render children()}
</div>
