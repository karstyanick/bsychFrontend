<script lang="ts">
	import { faRemove } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';
	import type { Player } from '../../types/game';

	const { gameId, players, onClose } = $props<{
		gameId: string;
		players: Player[];
		onClose: () => void;
	}>();

	// const backendHost = 'https://bsych.reallyfluffy.dev/goapi';
	// const wsBackendHost = 'wss://bsych.reallyfluffy.dev/goapi';
	const backendHost = 'http://localhost:8081';

	async function removePlayer(playerId: string) {
		fetch(`${backendHost}/game/${gameId}/player/${playerId}`, {
			method: 'DELETE'
		});
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div onclick={onClose} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
		role="form"
		onclick={(event) => event.stopPropagation()}
	>
		<h2 class="mb-4 text-center text-2xl font-bold text-gray-800">Remove players</h2>
		<!-- players -->
		<div class="mb-6">
			<ul class="space-y-1">
				{#each players as p}
					<li class="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
						<span class="truncate">{p.NickName}</span>
						{#if !p.Leader}
							<button class="" onclick={() => removePlayer(p.NickName)}>
								<Fa icon={faRemove} class="h-4 w-4 text-violet-700" />
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
