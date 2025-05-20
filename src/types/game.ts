export interface Player {
	Id: string,
	NickName: string
}
export interface Game {
	Id: string,
	Players: Player[]
}
