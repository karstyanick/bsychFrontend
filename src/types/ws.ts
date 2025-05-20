export interface OutgoingMessage {
	Type: string;
	Data: CreateGameData | JoinGameData
}

export interface CreateGameData {
	NickName: string
}

export interface JoinGameData {
	GameId: string
	NickName: string
}
