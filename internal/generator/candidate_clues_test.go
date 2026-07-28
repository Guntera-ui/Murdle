package generator

import (
	"math/rand"
	"testing"

	"murdle/internal/models"
)

func TestGenerateCandidateCluesAreAllTrue(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	clues := GenerateCandidateClues(
		config,
		assignments,
	)

	if len(clues) == 0 {
		t.Fatal("expected candidate clues to be generated")
	}

	for _, clue := range clues {
		if !clueSatisfied(assignments, clue) {
			t.Fatalf(
				"generated false clue: %+v",
				clue,
			)
		}
	}
}

func TestGenerateCandidateCluesExpectedCount(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	clues := GenerateCandidateClues(
		config,
		assignments,
	)

	size := len(config.Suspects)
	categoryPairCount := 6
	expected := categoryPairCount * size * size

	if len(clues) != expected {
		t.Fatalf(
			"expected %d candidate clues, got %d",
			expected,
			len(clues),
		)
	}
}

func TestGenerateCandidateCluesWithoutMotives(t *testing.T) {
	config := validConfig()
	config.Motives = nil

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	clues := GenerateCandidateClues(
		config,
		assignments,
	)

	for _, clue := range clues {
		if clue.Left.Category == models.CategoryMotive ||
			clue.Right.Category == models.CategoryMotive {
			t.Fatalf(
				"unexpected motive clue: %+v",
				clue,
			)
		}
	}

	size := len(config.Suspects)
	expected := 3 * size * size

	if len(clues) != expected {
		t.Fatalf(
			"expected %d candidate clues, got %d",
			expected,
			len(clues),
		)
	}
}

func TestGenerateCandidateCluesContainPositiveAndNegativeRelations(
	t *testing.T,
) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	clues := GenerateCandidateClues(
		config,
		assignments,
	)

	hasPositive := false
	hasNegative := false

	for _, clue := range clues {
		switch clue.Relation {
		case models.RelationIs:
			hasPositive = true

		case models.RelationIsNot:
			hasNegative = true
		}
	}

	if !hasPositive {
		t.Fatal("expected at least one positive clue")
	}

	if !hasNegative {
		t.Fatal("expected at least one negative clue")
	}
}
