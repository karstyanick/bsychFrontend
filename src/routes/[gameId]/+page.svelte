<script lang="ts">
	import { onMount } from 'svelte';
	import type { Game, Player } from '../../types/game';

	const { data } = $props<{
		data: {
			gameId: string;
			playerId: string;
		};
	}>();

	let ws: WebSocket;
	let roomCode = $state('');
	let players = $state<Player[]>([]);
	let prompts = $state<string[]>([]);
	let answers = $state<{ Answer: string; Score: number }[]>([]);
	let votes = $state<string[]>([]);
	let answerInput = $state('');
	let showCurrentRowAnswers = $state(false);
	let showNextPromptButton = $state(false);
	let showEndScreen = $state(false);

	async function voteAnswer(playerId: string) {
		await fetch(`http://localhost:8080/game/${data.gameId}/player/${data.playerId}/vote`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				PlayerId: playerId
			})
		});

		answerInput = '';
	}

	// Submit answer to the backend
	async function submitAnswer() {
		if (!answerInput || prompts.length === 0) return;

		await fetch(`http://localhost:8080/game/${data.gameId}/player/${data.playerId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				answer: answerInput
			})
		});

		answerInput = '';
	}

	async function nextPrompt() {
		await fetch(`http://localhost:8080/game/${data.gameId}`);
		showCurrentRowAnswers = false;
		showNextPromptButton = false;
	}

	onMount(() => {
		ws = new WebSocket('ws://localhost:8080/ws');

		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					Type: 'JoinGame',
					Data: {
						GameId: data.gameId,
						NickName: data.playerId
					}
				})
			);
		};

		ws.onmessage = async (event) => {
			const game: Game = JSON.parse(event.data);

			roomCode = game.Id;
			players = game.Players ?? players;
			if (game.Prompts?.length > 0) {
				prompts = game.Prompts;
			}

			answers = game.Players.find((p) => p.NickName == data.playerId)?.Answers || [];
			votes = game.Players.find((p) => p.NickName == data.playerId)?.Votes || [];

			if (players.every((p) => p.Answers.length == prompts.length)) {
				showCurrentRowAnswers = true;

				if (players.every((p) => p.Votes.length == prompts.length)) {
					if (game.NumberOfRounds == prompts.length) {
						showEndScreen = true;
					} else {
						showNextPromptButton = true;
					}
				}
			} else {
				showCurrentRowAnswers = false;
				showNextPromptButton = false;
			}
		};

		ws.onerror = (err) => {
			console.error('WebSocket error:', err);
		};

		ws.onclose = () => {
			console.log('WebSocket closed');
		};
	});
</script>

<h1 class="mb-4 text-2xl font-bold">Game: {roomCode}</h1>
{#if !showEndScreen}
	<p class="mb-4 font-semibold">Prompt: {prompts[prompts.length - 1]}</p>

	<!-- Answer input -->
	<div class="mb-6 flex gap-2">
		<input
			type="text"
			bind:value={answerInput}
			placeholder="Your answer"
			class="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring focus:outline-none"
			disabled={answers.length === prompts.length}
		/>
		<button
			class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
			onclick={submitAnswer}
			disabled={!answerInput}
		>
			Submit
		</button>
	</div>

	<!-- Player list with answer status -->
	<div class="space-y-2">
		<h2 class="mb-2 text-lg font-medium">Players</h2>
		<ul class="space-y-1">
			{#each players as player}
				<li class="flex items-center justify-between rounded bg-gray-100 px-4 py-2">
					<span>{player.NickName}</span>
					{#if !showCurrentRowAnswers}
						<span class="font-mono text-sm text-gray-600">
							{#if player.Answers && player.Answers.length > prompts.length - 1}
								✅ answered
							{:else}
								⏳ waiting
							{/if}
						</span>
					{/if}
					{#if showCurrentRowAnswers}
						<span class="font-mono text-sm text-gray-600">
							{player.Answers[prompts.length - 1].Answer}
						</span>
						<button
							onclick={() => voteAnswer(player.NickName)}
							disabled={votes.length === prompts.length}
							class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
						>
							Vote for this
						</button>
						<span>
							{player.Answers[prompts.length - 1].Score}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}

{#if showNextPromptButton}
	<div class="mt-6 flex gap-2">
		<button
			class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
			onclick={nextPrompt}
		>
			Next prompt
		</button>
	</div>
{/if}

{#if showEndScreen}
	<div class="mx-5 mt-8">
		<h3 class="mb-2 text-xl font-semibold">Total Scores</h3>
		<ul class="space-y-1">
			{#each players as player}
				<li class="flex justify-between text-sm font-medium">
					<span>{player.NickName}</span>
					<span class="text-blue-700">
						{player.Answers.reduce((sum, a) => sum + a.Score, 0)} pts
					</span>
				</li>
			{/each}
		</ul>
	</div>

	<div class="mt-8 border-t border-gray-300 p-6">
		<h2 class="mb-4 text-2xl font-bold">Final Results</h2>

		{#each prompts as prompt, i}
			<div class="mb-6 rounded-lg bg-white px-4 py-3 shadow">
				<h3 class="mb-2 text-lg font-semibold">Prompt {i + 1}</h3>
				<p class="mb-4 text-gray-700 italic">{prompt}</p>

				<ul class="space-y-1">
					{#each players as player}
						<li class="flex justify-between border-b pb-1 text-sm">
							<span class="text-gray-800">{player.NickName}</span>
							{#if player.Answers.length > i}
								<span class="font-mono text-gray-700">
									"{player.Answers[i].Answer}" ({player.Answers[i].Score} pts)
								</span>
							{:else}
								<span class="text-gray-400 italic">no answer</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
{/if}
