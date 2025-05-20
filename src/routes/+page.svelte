<script>
	import CreateGame from '../components/modals/CreateGame.svelte';
	import JoinGame from '../components/modals/JoinGame.svelte';

	let visibleCreateModal = $state(false);
	let visibleJoinModal = $state(false);
</script>

<div class="flex h-screen flex-col items-center justify-center gap-5">
	<button
		class="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
		onclick={() => (visibleCreateModal = true)}
	>
		Create game
	</button>
	<button
		class="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
		onclick={() => (visibleJoinModal = true)}
	>
		Join game
	</button>
</div>
{#if visibleCreateModal}
	<CreateGame onClose={() => (visibleCreateModal = false)} />
{/if}

{#if visibleJoinModal}
	<JoinGame onClose={() => (visibleJoinModal = false)} />
{/if}
