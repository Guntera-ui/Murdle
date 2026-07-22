package models

type Solution struct {
	Suspect  string `json:"suspect"`
	Weapon   string `json:"weapon"`
	Location string `json:"location"`
	Motive   string `json:"motive,omitempty"`
}

type Puzzle struct {
	ID        int      `json:"id"`
	Title     string   `json:"title"`
	Suspects  []string `json:"suspects"`
	Weapons   []string `json:"weapons"`
	Locations []string `json:"locations"`
	Motives   []string `json:"motives,omitempty"`
	Clues     []string `json:"clues"`
	Solution  Solution `json:"solution"`
}
