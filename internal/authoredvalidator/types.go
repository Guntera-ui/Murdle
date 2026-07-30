package authoredvalidator

import "murdle/internal/models"

type EvidenceMeaning struct {
	ClueIndex int                   `json:"clueIndex"`
	Left      models.EntitySelector `json:"left"`
	Relation  models.Relation       `json:"relation"`
	Right     models.EntitySelector `json:"right"`
}

type InterviewMeaning struct {
	InterviewIndex int                   `json:"interviewIndex"`
	Left           models.EntitySelector `json:"left"`
	Relation       models.Relation       `json:"relation"`
	Right          models.EntitySelector `json:"right"`
}

type LogicSpec struct {
	Evidence   []EvidenceMeaning  `json:"evidence,omitempty"`
	Interviews []InterviewMeaning `json:"interviews,omitempty"`
}

type Status string

const (
	StatusContradictory       Status = "contradictory"
	StatusUnique              Status = "unique"
	StatusAmbiguous           Status = "ambiguous"
	StatusUniqueWrongSolution Status = "unique_wrong_solution"
)

type CandidateSolution struct {
	Culprit     string                       `json:"culprit"`
	Weapon      string                       `json:"weapon"`
	Location    string                       `json:"location"`
	Motive      string                       `json:"motive,omitempty"`
	Assignments map[string]models.Assignment `json:"assignments"`
}

type Report struct {
	Status                    Status              `json:"status"`
	Valid                     bool                `json:"valid"`
	Unique                    bool                `json:"unique"`
	MatchesIntendedSolution   bool                `json:"matchesIntendedSolution"`
	SolutionsFound            int                 `json:"solutionsFound"`
	SolutionCountIsLowerBound bool                `json:"solutionCountIsLowerBound"`
	IntendedSolution          models.Solution     `json:"intendedSolution"`
	Candidates                []CandidateSolution `json:"candidates,omitempty"`
	UsedEvidence              int                 `json:"usedEvidence"`
	UsedInterviews            int                 `json:"usedInterviews"`
	NarrativeOnlyClues        []int               `json:"narrativeOnlyClues,omitempty"`
	NarrativeOnlyInterviews   []int               `json:"narrativeOnlyInterviews,omitempty"`
	Warnings                  []string            `json:"warnings,omitempty"`
}
