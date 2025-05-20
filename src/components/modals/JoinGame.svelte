<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Game, Player } from '../../types/game';
	import type { JoinGameData, OutgoingMessage } from '../../types/ws';
	const { onClose } = $props<{ onClose: () => void }>();

	let roomCodeInput = $state('');
	let nickNameInput = $state('');
	let players = $state<Player[]>([]);
	let ws: WebSocket | null = null;

	let connected = $state(false);
	let roomCode = $state('');

	const connectToRoom = () => {
		if (!roomCodeInput.trim()) return;
		if (players.find((player) => player.NickName == nickNameInput)) return;

		ws = new WebSocket('ws://localhost:8080/ws');

		ws.onopen = () => {
			console.log('✅ Connected to server');
			if (!ws) return;
			const message: OutgoingMessage<JoinGameData> = {
				Type: 'JoinGame',
				Data: {
					GameId: roomCodeInput,
					NickName: nickNameInput
				}
			};
			ws.send(JSON.stringify(message));
		};

		ws.onmessage = (event) => {
			if (event.data === 'StartGame') {
				goto(`/${roomCode}?playerId=${nickNameInput}`);
				return;
			}

			const game: Game = JSON.parse(event.data);

			roomCode = game.Id;
			players = game.Players ? game.Players : players;

			if (roomCode && players) {
				connected = true;
			}
		};

		ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		};

		ws.onclose = () => {
			console.log('🔌 WebSocket connection closed');
		};
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
	role="button"
	tabindex="0"
	aria-label="Close join modal"
	onclick={onClose}
>
	{#if connected}
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			role="form"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 class="mb-4 text-center text-2xl font-bold text-gray-800">Waiting for game start</h2>
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
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
	{#if !connected}
		<!-- modal -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			role="form"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 class="mb-4 text-center text-2xl font-bold text-gray-800">Join Game</h2>

			<!-- input -->
			<div class="mb-6">
				<label for="roomCode" class="mb-2 block text-sm font-medium text-gray-700">
					Enter Room Code
				</label>
				<input
					id="roomCode"
					bind:value={roomCodeInput}
					type="text"
					placeholder="ABC123"
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm tracking-wider focus:border-blue-500 focus:outline-none"
				/>
			</div>

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
				<button class="rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-100" onclick={onClose}>
					Cancel
				</button>
				<button
					class="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
					onclick={connectToRoom}
					disabled={roomCodeInput.trim().length === 0}
				>
					Join
				</button>
			</div>
		</div>
	{/if}
</div>
