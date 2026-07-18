package models

type Puzzle struct {
	ID        int      `json:"id"`
	Title     string   `json:"title"`
	Suspects  []string `json:"suspects"`
	Weapons   []string `json:"weapons"`
	Motives   []string `json:"motives"`
	Locations []string `json:"locations"`
	Clues     []string `json:"clues"`
}
