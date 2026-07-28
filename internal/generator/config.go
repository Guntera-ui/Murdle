package generator

import "murdle/internal/models"

type Config struct {
	ID          int           `json:"id"`
	Seed        int64         `json:"seed"`
	CaseNumber  string        `json:"caseNumber"`
	Title       string        `json:"title"`
	Status      string        `json:"status"`
	Description string        `json:"description"`
	Difficulty  string        `json:"difficulty"`
	Victim      models.Victim `json:"victim"`

	IncidentReport string `json:"incidentReport"`

	Suspects     []string          `json:"suspects"`
	SuspectIcons map[string]string `json:"suspectIcons,omitempty"`
	Weapons      []string          `json:"weapons"`
	Locations    []string          `json:"locations"`
	Motives      []string          `json:"motives,omitempty"`

	SuspectDetails  map[string]models.EntityDetails `json:"suspectDetails,omitempty"`
	WeaponDetails   map[string]models.EntityDetails `json:"weaponDetails,omitempty"`
	LocationDetails map[string]models.EntityDetails `json:"locationDetails,omitempty"`
	MotiveDetails   map[string]models.EntityDetails `json:"motiveDetails,omitempty"`

	StatementRules models.StatementRules `json:"statementRules"`

	Culprit string `json:"culprit"`

	MinEvidenceClues int `json:"minEvidenceClues"`
	MaxEvidenceClues int `json:"maxEvidenceClues"`
	MaxAttempts      int `json:"maxAttempts"`
}

func normalizeConfig(config Config) Config {
	if config.Status == "" {
		config.Status = "OPEN"
	}

	if config.MinEvidenceClues == 0 {
		switch len(config.Suspects) {
		case 5:
			config.MinEvidenceClues = 4
		default:
			config.MinEvidenceClues = 2
		}
	}

	if config.MaxEvidenceClues == 0 {
		switch len(config.Suspects) {
		case 5:
			config.MaxEvidenceClues = 8
		case 4:
			config.MaxEvidenceClues = 5
		default:
			config.MaxEvidenceClues = 4
		}
	}

	if config.MaxAttempts == 0 {
		config.MaxAttempts = 80
	}

	if !config.StatementRules.CulpritLies &&
		!config.StatementRules.InnocentsTellTruth {
		config.StatementRules = models.StatementRules{
			CulpritLies:        true,
			InnocentsTellTruth: true,
		}
	}

	return config
}
