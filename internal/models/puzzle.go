package models

type Solution struct {
	Suspect  string `json:"suspect"`
	Weapon   string `json:"weapon"`
	Location string `json:"location"`
	Motive   string `json:"motive,omitempty"`
}

type Victim struct {
	Name         string `json:"name"`
	Occupation   string `json:"occupation"`
	CauseOfDeath string `json:"causeOfDeath"`
}

type Interview struct {
	Speaker   string `json:"speaker"`
	Statement string `json:"statement"`
}

type Puzzle struct {
	ID         int    `json:"id"`
	CaseNumber string `json:"caseNumber"`
	Title      string `json:"title"`
	Status     string `json:"status"`

	Victim         Victim      `json:"victim"`
	IncidentReport string      `json:"incidentReport"`
	Interviews     []Interview `json:"interviews"`

	Suspects  []string `json:"suspects"`
	Weapons   []string `json:"weapons"`
	Locations []string `json:"locations"`
	Motives   []string `json:"motives,omitempty"`

	Clues    []string `json:"clues"`
	Solution Solution `json:"solution"`
}
