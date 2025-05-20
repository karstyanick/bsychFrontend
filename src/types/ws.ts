export interface OutgoingMessage<T> {
	Type: string;
	Data: T;
}

export interface CreateGameData {
	NickName: string
	NumberOfRounds: number
}

export interface JoinGameData {
	GameId: string
	NickName: string
}

export interface StartGameData {
	GameId: string
	NumberOfRounds: number
}
