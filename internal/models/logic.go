package models

type Category string

const (
	CategorySuspect  Category = "suspect"
	CategoryWeapon   Category = "weapon"
	CategoryLocation Category = "location"
	CategoryMotive   Category = "motive"
)

type Relation string

const (
	RelationIs    Relation = "is"
	RelationIsNot Relation = "is_not"
)

type ClueType string

const (
	ClueTypePair ClueType = "pair"
)

type EntityRef struct {
	Category Category `json:"category"`
	Value    string   `json:"value"`
}

type ClueSource struct {
	Type    string `json:"type"`
	Speaker string `json:"speaker,omitempty"`
}

type LogicClue struct {
	ID            string          `json:"id"`
	Type          ClueType        `json:"type"`
	Left          EntityRef       `json:"left"`
	Right         EntityRef       `json:"right"`
	Relation      Relation        `json:"relation"`
	LeftSelector  *EntitySelector `json:"leftSelector,omitempty"`
	RightSelector *EntitySelector `json:"rightSelector,omitempty"`
	Text          string          `json:"text"`
	Source        ClueSource      `json:"source"`
}

type Assignment struct {
	Weapon   string `json:"weapon"`
	Location string `json:"location"`
	Motive   string `json:"motive,omitempty"`
}

type GenerationMetadata struct {
	Seed                   int64  `json:"seed"`
	GeneratorVersion       string `json:"generatorVersion"`
	VerifiedUniqueSolution bool   `json:"verifiedUniqueSolution"`
	SolutionCount          int    `json:"solutionCount"`
	EvidenceClueCount      int    `json:"evidenceClueCount"`
	StatementCount         int    `json:"statementCount"`
	Attempt                int    `json:"attempt"`
}
