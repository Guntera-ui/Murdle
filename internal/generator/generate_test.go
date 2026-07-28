package generator

import (
	"reflect"
	"testing"

	"murdle/internal/models"
)

func testConfig() Config {
	return Config{
		ID:          7,
		Seed:        1001,
		CaseNumber:  "007",
		Title:       "THE ENAGETI INCIDENT",
		Status:      "OPEN",
		Description: "A village guardian is found dead at dawn.",
		Difficulty:  "Easy",
		Victim: models.Victim{
			Name:         "Ginger",
			Occupation:   "Village Guardian",
			CauseOfDeath: "Head Injury",
		},
		IncidentReport:   "Story text can be edited manually after generation.",
		Suspects:         []string{"Marki", "Bego", "Baxi"},
		Weapons:          []string{"Crowbar", "Rock", "Brick"},
		Locations:        []string{"Warehouse", "Garden", "House"},
		Motives:          []string{"Greed", "Revenge", "Jealousy"},
		Culprit:          "Bego",
		MinEvidenceClues: 2,
		MaxEvidenceClues: 4,
		MaxAttempts:      100,
		StatementRules: models.StatementRules{
			CulpritLies:        true,
			InnocentsTellTruth: true,
		},
		SuspectDetails: map[string]models.EntityDetails{
			"Marki": {
				Attributes: map[string]models.AttributeValue{
					"height": {Kind: models.AttributeNumber, Number: 58},
					"zodiac": {Kind: models.AttributeString, String: "Libra"},
				},
			},
			"Bego": {
				Attributes: map[string]models.AttributeValue{
					"height": {Kind: models.AttributeNumber, Number: 65},
					"zodiac": {Kind: models.AttributeString, String: "Leo"},
				},
			},
			"Baxi": {
				Attributes: map[string]models.AttributeValue{
					"height": {Kind: models.AttributeNumber, Number: 62},
					"zodiac": {Kind: models.AttributeString, String: "Virgo"},
				},
			},
		},
		WeaponDetails: map[string]models.EntityDetails{
			"Crowbar": {
				Attributes: map[string]models.AttributeValue{
					"weight": {Kind: models.AttributeNumber, Number: 8},
				},
			},
			"Rock": {
				Attributes: map[string]models.AttributeValue{
					"weight": {Kind: models.AttributeNumber, Number: 4},
				},
			},
			"Brick": {
				Attributes: map[string]models.AttributeValue{
					"weight": {Kind: models.AttributeNumber, Number: 6},
				},
			},
		},
		LocationDetails: map[string]models.EntityDetails{
			"Warehouse": {
				Attributes: map[string]models.AttributeValue{
					"indoors": {Kind: models.AttributeBool, Bool: true},
				},
			},
			"Garden": {
				Attributes: map[string]models.AttributeValue{
					"indoors": {Kind: models.AttributeBool, Bool: false},
				},
			},
			"House": {
				Attributes: map[string]models.AttributeValue{
					"indoors": {Kind: models.AttributeBool, Bool: true},
				},
			},
		},
	}
}

func TestGenerateCreatesMurdleStyleMystery(t *testing.T) {
	config := testConfig()
	puzzle, err := Generate(config)
	if err != nil {
		t.Fatal(err)
	}

	if len(puzzle.Clues) < 2 || len(puzzle.Clues) > 4 {
		t.Fatalf("expected 2-4 evidence clues, got %d", len(puzzle.Clues))
	}

	if len(puzzle.Interviews) != len(config.Suspects) {
		t.Fatalf(
			"expected %d interviews, got %d",
			len(config.Suspects),
			len(puzzle.Interviews),
		)
	}

	if len(puzzle.LogicStatements) != len(config.Suspects) {
		t.Fatalf(
			"expected %d logic statements, got %d",
			len(config.Suspects),
			len(puzzle.LogicStatements),
		)
	}

	count, err := countMysterySolutionsOnly(
		config,
		puzzle.LogicClues,
		puzzle.LogicStatements,
		2,
	)
	if err != nil {
		t.Fatal(err)
	}

	if count != 1 {
		t.Fatalf("expected exactly one mystery solution, got %d", count)
	}

	if puzzle.Solution.Suspect != config.Culprit {
		t.Fatalf(
			"expected culprit %q, got %q",
			config.Culprit,
			puzzle.Solution.Suspect,
		)
	}

	if puzzle.Generation.SolutionCount != 1 {
		t.Fatalf(
			"expected metadata solutionCount 1, got %d",
			puzzle.Generation.SolutionCount,
		)
	}
}

func TestGenerateIsRepeatable(t *testing.T) {
	config := testConfig()

	first, err := Generate(config)
	if err != nil {
		t.Fatal(err)
	}

	second, err := Generate(config)
	if err != nil {
		t.Fatal(err)
	}

	if !reflect.DeepEqual(first, second) {
		t.Fatal("same config and seed produced different puzzles")
	}
}

func TestGeneratedStatementsFollowTruthRules(t *testing.T) {
	config := testConfig()
	puzzle, err := Generate(config)
	if err != nil {
		t.Fatal(err)
	}

	for _, statement := range puzzle.LogicStatements {
		claimIsTrue := clueSatisfied(
			puzzle.Assignments,
			statement.Claim,
		)

		if statement.Speaker == config.Culprit && claimIsTrue {
			t.Fatalf("culprit %q received a true statement", statement.Speaker)
		}

		if statement.Speaker != config.Culprit && !claimIsTrue {
			t.Fatalf("innocent %q received a false statement", statement.Speaker)
		}
	}
}

func TestResolveSecondTallestSelector(t *testing.T) {
	config := testConfig()

	ref, err := ResolveSelector(config, models.EntitySelector{
		Category:  models.CategorySuspect,
		Attribute: "height",
		Rank:      2,
		Order:     "descending",
	})
	if err != nil {
		t.Fatal(err)
	}

	if ref.Value != "Baxi" {
		t.Fatalf("expected Baxi, got %q", ref.Value)
	}
}

func TestFiveByFiveConfigurationValidates(t *testing.T) {
	config := testConfig()
	config.Suspects = []string{"A", "B", "C", "D", "E"}
	config.Weapons = []string{"W1", "W2", "W3", "W4", "W5"}
	config.Locations = []string{"L1", "L2", "L3", "L4", "L5"}
	config.Motives = []string{"M1", "M2", "M3", "M4", "M5"}
	config.Culprit = "C"
	config.SuspectDetails = nil
	config.WeaponDetails = nil
	config.LocationDetails = nil

	if err := ValidateConfig(config); err != nil {
		t.Fatalf("expected 5x5x5x5 config to validate, got %v", err)
	}
}
