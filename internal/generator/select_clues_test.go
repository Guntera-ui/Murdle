package generator

import (
	"math/rand"
	"testing"

	"murdle/internal/models"
)

func TestSelectCluesProducesUniqueSolution(t *testing.T) {
	config := validConfig()
	random := rand.New(rand.NewSource(config.Seed))

	assignments := GenerateAssignments(
		config,
		random,
	)

	candidates := GenerateCandidateClues(
		config,
		assignments,
	)

	selected, err := SelectClues(
		config,
		candidates,
		random,
	)

	if err != nil {
		t.Fatalf(
			"expected clue selection to succeed, got %v",
			err,
		)
	}

	if len(selected) == 0 {
		t.Fatal("expected at least one selected clue")
	}

	count, _ := CountSolutions(
		config,
		selected,
		2,
	)

	if count != 1 {
		t.Fatalf(
			"expected exactly 1 solution, got %d",
			count,
		)
	}
}

func TestSelectedCluesAreTrueForHiddenAssignment(t *testing.T) {
	config := validConfig()
	random := rand.New(rand.NewSource(config.Seed))

	assignments := GenerateAssignments(
		config,
		random,
	)

	candidates := GenerateCandidateClues(
		config,
		assignments,
	)

	selected, err := SelectClues(
		config,
		candidates,
		random,
	)

	if err != nil {
		t.Fatal(err)
	}

	for _, clue := range selected {
		if !clueSatisfied(assignments, clue) {
			t.Fatalf(
				"selected false clue: %+v",
				clue,
			)
		}
	}
}

func TestMinimizeCluesKeepsUniqueSolution(t *testing.T) {
	config := validConfig()
	random := rand.New(rand.NewSource(config.Seed))

	assignments := GenerateAssignments(
		config,
		random,
	)

	candidates := GenerateCandidateClues(
		config,
		assignments,
	)

	selected, err := SelectClues(
		config,
		candidates,
		random,
	)

	if err != nil {
		t.Fatal(err)
	}

	minimized := MinimizeClues(
		config,
		selected,
	)

	count, _ := CountSolutions(
		config,
		minimized,
		2,
	)

	if count != 1 {
		t.Fatalf(
			"expected minimized clues to keep 1 solution, got %d",
			count,
		)
	}

	if len(minimized) > len(selected) {
		t.Fatalf(
			"expected minimized clue count not to increase: before %d, after %d",
			len(selected),
			len(minimized),
		)
	}
}

func TestMinimizedCluesAreNecessary(t *testing.T) {
	config := validConfig()
	random := rand.New(rand.NewSource(config.Seed))

	assignments := GenerateAssignments(
		config,
		random,
	)

	candidates := GenerateCandidateClues(
		config,
		assignments,
	)

	selected, err := SelectClues(
		config,
		candidates,
		random,
	)

	if err != nil {
		t.Fatal(err)
	}

	minimized := MinimizeClues(
		config,
		selected,
	)

	for index := range minimized {
		trial := make(
			[]models.LogicClue,
			0,
			len(minimized)-1,
		)

		trial = append(
			trial,
			minimized[:index]...,
		)

		trial = append(
			trial,
			minimized[index+1:]...,
		)

		count, _ := CountSolutions(
			config,
			trial,
			2,
		)

		if count == 1 {
			t.Fatalf(
				"clue at index %d was still redundant",
				index,
			)
		}
	}
}
