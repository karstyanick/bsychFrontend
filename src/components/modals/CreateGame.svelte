<script lang="ts">
	import type { Game, Player } from '../../types/game';
	import type { CreateGameData, OutgoingMessage, StartGameData } from '../../types/ws';
	import { goto } from '$app/navigation';
	import { stopPropagation } from 'svelte/legacy';
	import { faRemove } from '@fortawesome/free-solid-svg-icons';
	import Fa from 'svelte-fa';

	const { onClose } = $props<{
		onClose: () => void;
	}>();

	let gameId = $state('');
	let rounds = $state(5);
	let players = $state<Player[]>([]);
	let ws: WebSocket;
	let created = $state(false);
	let nickNameInput = $state('');
	const wsBackendHost = 'wss://bsych.reallyfluffy.dev/goapi';
	const backendHost = 'https://bsych.reallyfluffy.dev/goapi';
	// const wsBackendHost = 'ws://localhost:8081';
	// const backendHost = 'http://localhost:8081';

	const createRoom = async () => {
		ws = new WebSocket(`${wsBackendHost}/ws`);

		ws.onopen = () => {
			const createGameMessage: OutgoingMessage<CreateGameData> = {
				Type: 'CreateGame',
				Data: {
					NickName: nickNameInput,
					NumberOfRounds: rounds
				}
			};
			ws.send(JSON.stringify(createGameMessage));
		};

		ws.onmessage = (event) => {
			if (event.data === 'StartGame') {
				goto(`/${gameId}?playerId=${nickNameInput}`);
				return;
			}

			const game: Game = JSON.parse(event.data);

			gameId = game.Id;
			created = true;
			players = game.Players ? game.Players : players;
		};

		ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		};

		ws.onclose = () => {
			console.log('🔌 WebSocket connection closed');
		};
	};

	const onStart = () => {
		if (!ws) return;
		const startGameMessage: OutgoingMessage<StartGameData> = {
			Type: 'StartGame',
			Data: {
				GameId: gameId,
				NumberOfRounds: parseInt(rounds as any)
			}
		};
		ws.send(JSON.stringify(startGameMessage));
	};

	const removePlayer = (playerId: string) => {
		fetch(`${backendHost}/game/${gameId}/player/${playerId}`, {
			method: 'DELETE'
		});
	};

	const handleClose = () => {
		if (confirm('Are you sure you want to close this dialog? Any progress will be lost.')) {
			onClose();
		}
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
		role="form"
		onclick={(event) => event.stopPropagation()}
	>
		{#if !created}
			<!-- nickname input -->
			<div class="mb-6">
				<label for="roomCode" class="mb-2 block text-sm font-medium text-gray-700">
					Enter Nickname
				</label>
				<input
					id="nickname"
					bind:value={nickNameInput}
					type="text"
					placeholder="Player 123"
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm tracking-wider focus:border-blue-500 focus:outline-none"
				/>
			</div>
			<!-- buttons -->
			<div class="flex justify-end space-x-3">
				<button
					class="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
					onclick={handleClose}
				>
					Cancel
				</button>
				<button
					class="rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
					onclick={createRoom}
					disabled={nickNameInput.trim().length === 0}
				>
					Create
				</button>
			</div>
		{/if}
		{#if created}
			<h2 class="mb-4 text-center text-2xl font-bold text-gray-800">Create Game</h2>

			<!-- room code -->
			<div class="mb-6 flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
				<span class="font-mono text-lg tracking-widest">{gameId}</span>
				<button
					class="text-sm text-violet-700 hover:underline"
					onclick={() => navigator.clipboard.writeText(gameId)}
				>
					copy
				</button>
			</div>

			<!-- players -->
			<div class="mb-6">
				<h3 class="mb-2 text-sm font-semibold text-gray-600">Players connected</h3>
				{#if players.length === 0}
					<p class="text-sm text-gray-500">Waiting for players…</p>
				{:else}
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
				{/if}
			</div>

			<!-- round selector -->
			<div class="mb-6 flex items-center justify-between">
				<label for="rounds" class="text-sm font-medium text-gray-700">Rounds</label>
				<select
					id="rounds"
					bind:value={rounds}
					class="rounded border border-gray-300 py-1 pl-2 text-sm focus:border-blue-500 focus:outline-none"
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={15}>15</option>
					<option value={20}>20</option>
				</select>
			</div>

			<!-- actions -->
			<div class="flex justify-end space-x-3">
				<button
					class="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
					onclick={handleClose}
				>
					Cancel
				</button>
				<button
					class="rounded bg-violet-600 px-4 py-2 text-sm font-semibold text-white
                 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={onStart}
					disabled={players.length === 0}
				>
					Start game
				</button>
			</div>
		{/if}
	</div>
</div>
