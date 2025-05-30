<script lang="ts">
	import { onMount } from 'svelte';
	import type { Game, Player } from '../../types/game';

	import { fade } from 'svelte/transition';
	import Fa from 'svelte-fa';
	import { faCheck, faCrown } from '@fortawesome/free-solid-svg-icons';
	import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
	import { faThumbsUp as faThumbsUpSolid } from '@fortawesome/free-solid-svg-icons';
	import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
	import { goto } from '$app/navigation';

	const { data } = $props<{
		data: {
			gameId: string;
			playerId: string;
		};
	}>();

	function shuffle(array: any[]) {
		let copy = [...array];
		let currentIndex = copy.length;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {
			// Pick a remaining element...
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[copy[currentIndex], copy[randomIndex]] = [copy[randomIndex], copy[currentIndex]];
		}
		return copy;
	}

	let ws: WebSocket;
	let roomCode = $state('');
	let players = $state<Player[]>([]);
	let shuffledPlayers = $state<Player[]>([]);
	let me = $state<Player>();
	let prompts = $state<string[]>([]);
	let answers = $state<{ Answer: string; Score: number }[]>([]);
	let votes = $state<string[]>([]);
	let answerInput = $state('');
	let showCurrentRowAnswers = $state(false);
	let showNextPromptButton = $state(false);
	let showEndScreen = $state(false);
	const backendHost = 'https://bsych.reallyfluffy.dev/goapi';
	const wsBackendHost = 'wss://bsych.reallyfluffy.dev/goapi';
	// const wsBackendHost = 'ws://localhost:8081';
	// const backendHost = 'http://localhost:8081';
	let sortedPlayers: Player[] = $state([]);

	async function voteAnswer(playerId: string) {
		await fetch(`${backendHost}/game/${data.gameId}/player/${data.playerId}/vote`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				PlayerId: playerId
			})
		});
	}

	// Submit answer to the backend
	async function submitAnswer() {
		if (!answerInput || prompts.length === 0) return;

		await fetch(`${backendHost}/game/${data.gameId}/player/${data.playerId}`, {
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
		await fetch(`${backendHost}/game/${data.gameId}`);
		showCurrentRowAnswers = false;
		showNextPromptButton = false;
	}

	async function newGame() {
		goto(`/`);
	}

	onMount(() => {
		ws = new WebSocket(`${wsBackendHost}/ws`);

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

			me = game.Players.find((p) => p.NickName === data.playerId);
			answers = me?.Answers || [];
			votes = me?.Votes || [];

			if (players.every((p) => p.Answers.length === prompts.length)) {
				if (!showCurrentRowAnswers) {
					showCurrentRowAnswers = true;
					shuffledPlayers = shuffle(players);
				} else {
					shuffledPlayers = shuffledPlayers.map(
						(player) => players.find((it) => it.NickName === player.NickName) as Player
					);
				}

				if (players.every((p) => p.Votes.length === prompts.length)) {
					if (game.NumberOfRounds === prompts.length) {
						showEndScreen = true;

						sortedPlayers = [...players].sort(
							(prev, curr) =>
								curr.Answers.reduce((s, a) => s + a.Score, 0) -
								prev.Answers.reduce((s, a) => s + a.Score, 0)
						);

						await fetch(`${backendHost}/game/${data.gameId}`, {
							method: 'DELETE',
							headers: {
								'Content-Type': 'application/json'
							}
						});
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

<div class="px-4 py-4 sm:px-6">
	<h1 class="mb-3 text-center text-2xl font-extrabold tracking-wide text-violet-700">
		Room {roomCode}
	</h1>

	{#if !showEndScreen}
		<p
			class="mb-4 rounded bg-violet-100 px-3 py-2 text-center text-base font-semibold text-violet-800 shadow-sm"
		>
			{prompts[prompts.length - 1]}
		</p>
		{#if !showCurrentRowAnswers}
			<!-- Answer input -->
			<div class="mb-5 flex flex-col gap-2 sm:flex-row">
				<input
					type="text"
					bind:value={answerInput}
					placeholder="Your answer…"
					class="flex-1 rounded-lg border border-violet-300 px-4 py-3 text-sm shadow-sm focus:border-violet-500 focus:outline-none disabled:bg-gray-100"
					disabled={answers.length === prompts.length}
				/>

				<button
					class="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={submitAnswer}
					disabled={!answerInput}
				>
					Send
				</button>
			</div>
		{/if}
		<!-- Player list -->
		<div class="space-y-3">
			<h2 class="text-lg font-semibold text-violet-700">Players</h2>

			<ul class="space-y-2">
				{#if !showCurrentRowAnswers}
					{#each players as player (player.NickName)}
						<!-- one card per player -->
						<li
							class="grid grid-cols-[auto_1fr_auto_auto] items-start
               gap-x-2
               rounded-xl bg-white/80 px-4 py-3 shadow
               transition duration-300
               {showCurrentRowAnswers ? 'animate-fade-in' : ''}"
						>
							<span
								in:fade={{ duration: 500 }}
								class="max-w-[6rem] truncate font-medium sm:max-w-none"
							>
								{player.NickName}
							</span>

							{#if player.Answers.length > prompts.length - 1}
								<Fa icon={faCheck} class="col-start-4 w-5 justify-self-end text-violet-700" />
							{:else}
								<Fa
									icon={faHourglassHalf}
									class="col-start-4 w-5 justify-self-end text-violet-700"
								/>
							{/if}
						</li>
					{/each}
				{/if}
				{#if showCurrentRowAnswers}
					{#each shuffledPlayers as player (player.NickName)}
						<!-- one card per player -->
						<li
							class="grid grid-cols-[auto_1fr_auto_auto] items-start
               gap-x-2
               rounded-xl bg-white/80 px-4 py-3 shadow
               transition duration-300
               {showCurrentRowAnswers ? 'animate-fade-in' : ''}"
						>
							{#if showNextPromptButton}
								<span
									in:fade={{ duration: 500 }}
									class="max-w-[6rem] truncate font-medium sm:max-w-none"
								>
									{player.NickName}
								</span>
							{:else}
								<span class="max-w-[6rem] truncate font-medium sm:max-w-none"> •••••••• </span>
							{/if}

							<!-- 3️⃣ score -->
							<span class="text-left text-right text-sm font-semibold text-violet-700">
								{player.Answers[prompts.length - 1].Score}
							</span>
							<!-- 4️⃣ vote button -->
							<button
								class="justify-self-end {me?.Votes.length === prompts.length &&
								me?.Votes.slice(-1)[0] !== player.NickName
									? 'disabled:opacity-40'
									: ''}"
								onclick={() => voteAnswer(player.NickName)}
								disabled={votes.length === prompts.length}
							>
								{#if me?.Votes.length === prompts.length && me?.Votes.slice(-1)[0] === player.NickName}
									<Fa icon={faThumbsUpSolid} class="h-4 w-4 text-violet-700" />
								{:else}
									<Fa icon={faThumbsUp} class="h-4 w-4 text-violet-700" />
								{/if}
							</button>
							<!-- 2️⃣ answer (full-width on mobile, col-2 on ≥sm) -->
							<p
								class="answer col-span-full mt-2 max-h-16
                   overflow-y-auto pr-1
                   text-sm break-words text-gray-700
                   sm:col-span-1 sm:col-start-1 sm:mt-0"
							>
								{player.Answers[prompts.length - 1].Answer}
							</p>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	{/if}

	<!-- Next-prompt button -->
	{#if showNextPromptButton && players.find((player) => player.Leader)?.NickName === data.playerId}
		<div class="mt-6 text-center">
			<button
				class="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
				onclick={nextPrompt}
			>
				Next prompt
			</button>
		</div>
	{/if}

	<!-- End-screen -->
	{#if showEndScreen}
		<div class="mx-auto mt-8 max-w-md space-y-8">
			<!-- totals -->
			<div class="rounded-xl bg-white/90 p-6 shadow-lg">
				<h3 class="mb-3 text-xl font-bold text-violet-700">Total Scores</h3>
				<ul class="space-y-2">
					{#each sortedPlayers as player, i}
						<li
							class="grid grid-cols-[1.25rem_1fr_auto_auto] items-start gap-x-2 text-sm font-medium"
						>
							<!-- Crown or empty space -->
							<div class="h-4 w-4">
								{#if i === 0}
									<Fa icon={faCrown} class="h-4 w-4 text-violet-700" />
								{:else}
									<!-- Keeps spacing consistent -->
									<span class="inline-block h-4 w-4"></span>
								{/if}
							</div>

							<span>{player.NickName}</span>
							<span class="text-violet-700">
								{player.Answers.reduce((s, a) => s + a.Score, 0)} pts
							</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- per-prompt breakdown -->
			<div class="rounded-xl bg-white/90 p-6 shadow-lg">
				<h2 class="mb-4 text-2xl font-bold">Final Results</h2>

				{#each prompts as prompt, i}
					<div class="mb-6 last:mb-0">
						<h3 class="mb-2 text-base font-semibold text-violet-700">
							Prompt {i + 1}
						</h3>
						<p class="mb-3 rounded bg-violet-50 px-3 py-2 text-sm text-violet-800 italic">
							{prompt}
						</p>

						<ul class="space-y-1">
							{#each players as player}
								<li class="flex justify-between border-b pb-1 text-xs last:border-b-0">
									<span class="font-medium text-gray-700">{player.NickName}</span>
									{#if player.Answers.length > i}
										<span class="font-mono text-gray-600">
											“{player.Answers[i].Answer}” ({player.Answers[i].Score} pts)
										</span>
									{:else}
										<span class="text-gray-400 italic">no answer</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
				<div class="mt-6 text-center">
					<button
						class="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
						onclick={newGame}
					>
						New Game
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* simple fade-in once answers reveal */
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.25s ease-out;
	}
</style>
