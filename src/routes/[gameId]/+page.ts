import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	return {
		gameId: params.gameId,
		playerId: url.searchParams.get("playerId")
	};
};
