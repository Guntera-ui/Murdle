package generator

import (
	"testing"

	"murdle/internal/models"
)

func TestPermutationsReturnsAllArrangements(t *testing.T) {
	values := []string{"A", "B", "C"}

	result := permutations(values)

	if len(result) != 6 {
		t.Fatalf(
			"expected 6 permutations, got %d",
			len(result),
		)
	}
}

func TestCountSolutionsWithoutClues(t *testing.T) {
	config := validConfig()

	count, _ := CountSolutions(
		config,
		nil,
		0,
	)

	expected := 6 * 6 * 6

	if count != expected {
		t.Fatalf(
			"expected %d solutions, got %d",
			expected,
			count,
		)
	}
}

func TestCountSolutionsStopsAtLimit(t *testing.T) {
	config := validConfig()

	count, solutions := CountSolutions(
		config,
		nil,
		2,
	)

	if count != 2 {
		t.Fatalf(
			"expected count 2, got %d",
			count,
		)
	}

	if len(solutions) != 2 {
		t.Fatalf(
			"expected 2 returned solutions, got %d",
			len(solutions),
		)
	}
}

func TestCountSolutionsCanFindOneExactAssignment(t *testing.T) {
	config := validConfig()

	assignments := map[string]models.Assignment{
		"Marki": {
			Weapon:   "Crowbar",
			Location: "Warehouse",
			Motive:   "Greed",
		},
		"Bego": {
			Weapon:   "Rock",
			Location: "Garden",
			Motive:   "Revenge",
		},
		"Baxi": {
			Weapon:   "Brick",
			Location: "House",
			Motive:   "Jealousy",
		},
	}

	clues := make([]models.LogicClue, 0)

	for suspect, assignment := range assignments {
		clues = append(
			clues,
			models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    suspect,
				},
				Right: models.EntityRef{
					Category: models.CategoryWeapon,
					Value:    assignment.Weapon,
				},
				Relation: models.RelationIs,
			},
			models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    suspect,
				},
				Right: models.EntityRef{
					Category: models.CategoryLocation,
					Value:    assignment.Location,
				},
				Relation: models.RelationIs,
			},
			models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    suspect,
				},
				Right: models.EntityRef{
					Category: models.CategoryMotive,
					Value:    assignment.Motive,
				},
				Relation: models.RelationIs,
			},
		)
	}

	count, _ := CountSolutions(
		config,
		clues,
		2,
	)

	if count != 1 {
		t.Fatalf(
			"expected exactly 1 solution, got %d",
			count,
		)
	}
}
