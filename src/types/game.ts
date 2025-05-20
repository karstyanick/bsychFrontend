export interface Player {
	Leader: boolean
	NickName: string
	Answers: {
		Answer: string,
		Score: number
	}[]
	Votes: string[];
}
export interface Game {
	Id: string
	Category: string
	NumberOfRounds: number
	Prompts: string[]
	Players: Player[]
}
