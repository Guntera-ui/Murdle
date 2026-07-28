package models

type LogicStatement struct {
	ID      string    `json:"id"`
	Speaker string    `json:"speaker"`
	Text    string    `json:"text"`
	Claim   LogicClue `json:"claim"`
}
