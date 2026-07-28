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
	ID          int    `json:"id"`
	CaseNumber  string `json:"caseNumber"`
	Title       string `json:"title"`
	Status      string `json:"status"`
	Description string `json:"description"`
	Difficulty  string `json:"difficulty"`

	Victim         Victim      `json:"victim"`
	IncidentReport string      `json:"incidentReport"`
	Interviews     []Interview `json:"interviews"`

	Suspects     []string          `json:"suspects"`
	SuspectIcons map[string]string `json:"suspectIcons,omitempty"`
	Weapons      []string          `json:"weapons"`
	Locations    []string          `json:"locations"`
	Motives      []string          `json:"motives,omitempty"`

	SuspectDetails  map[string]EntityDetails `json:"suspectDetails,omitempty"`
	WeaponDetails   map[string]EntityDetails `json:"weaponDetails,omitempty"`
	LocationDetails map[string]EntityDetails `json:"locationDetails,omitempty"`
	MotiveDetails   map[string]EntityDetails `json:"motiveDetails,omitempty"`

	StatementRules  StatementRules   `json:"statementRules,omitempty"`
	LogicStatements []LogicStatement `json:"logicStatements,omitempty"`

	Assignments map[string]Assignment `json:"assignments,omitempty"`
	Culprit     string                `json:"culprit,omitempty"`
	LogicClues  []LogicClue           `json:"logicClues,omitempty"`
	Generation  GenerationMetadata    `json:"generation,omitempty"`

	Clues    []string `json:"clues"`
	Solution Solution `json:"solution"`
}
