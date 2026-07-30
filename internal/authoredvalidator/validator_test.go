package authoredvalidator

import (
	"reflect"
	"testing"

	"murdle/internal/models"
)

func TestValidateFindsUniqueIntendedSolution(
	t *testing.T,
) {
	puzzle :=
		validPuzzle()

	original :=
		clonePuzzleForTest(
			puzzle,
		)

	report, err :=
		Validate(
			puzzle,
			validSpec(),
		)

	if err != nil {
		t.Fatal(err)
	}

	if !report.Valid {
		t.Fatalf(
			"expected valid report, got status %q",
			report.Status,
		)
	}

	if report.SolutionsFound != 1 {
		t.Fatalf(
			"expected 1 solution, got %d",
			report.SolutionsFound,
		)
	}

	if !reflect.DeepEqual(
		puzzle,
		original,
	) {
		t.Fatal(
			"validator mutated the authored puzzle",
		)
	}
}

func TestValidateReportsAmbiguousCase(
	t *testing.T,
) {
	puzzle :=
		validPuzzle()

	spec := LogicSpec{
		Evidence: []EvidenceMeaning{
			validSpec().
				Evidence[0],
		},
	}

	report, err :=
		Validate(
			puzzle,
			spec,
		)

	if err != nil {
		t.Fatal(err)
	}

	if report.Status !=
		StatusAmbiguous {
		t.Fatalf(
			"expected ambiguous status, got %q",
			report.Status,
		)
	}

	if report.SolutionsFound != 2 ||
		!report.SolutionCountIsLowerBound {
		t.Fatalf(
			"expected search to stop at 2 solutions, got %+v",
			report,
		)
	}
}

func TestValidateReportsUniqueWrongSolution(
	t *testing.T,
) {
	puzzle :=
		validPuzzle()

	puzzle.Solution =
		models.Solution{
			Suspect:  "Ava",
			Weapon:   "Candlestick",
			Location: "Study",
		}

	report, err :=
		Validate(
			puzzle,
			validSpec(),
		)

	if err != nil {
		t.Fatal(err)
	}

	if report.Status !=
		StatusUniqueWrongSolution {
		t.Fatalf(
			"expected unique_wrong_solution, got %q",
			report.Status,
		)
	}
}

func validPuzzle() models.Puzzle {
	return models.Puzzle{
		ID:         11,
		CaseNumber: "011",
		Title:      "THE CLOCKMAKER CASE",
		Status:     "OPEN",
		Difficulty: "Easy",
		Suspects: []string{
			"Ava",
			"Ben",
			"Cora",
		},
		Weapons: []string{
			"Candlestick",
			"Rope",
			"Knife",
		},
		Locations: []string{
			"Study",
			"Kitchen",
			"Garden",
		},
		Clues: []string{
			"Ava carried the Candlestick.",
			"Ben carried the Rope.",
			"Ava was in the Study.",
			"Ben was in the Kitchen.",
			"Cora was in the Garden.",
		},
		Interviews: []models.Interview{
			{
				Speaker:   "Ava",
				Statement: "Cora carried the Knife.",
			},
			{
				Speaker:   "Ben",
				Statement: "Ava carried the Rope.",
			},
			{
				Speaker:   "Cora",
				Statement: "Ava was in the Study.",
			},
		},
		StatementRules: models.StatementRules{
			CulpritLies:        true,
			InnocentsTellTruth: true,
		},
		Solution: models.Solution{
			Suspect:  "Ben",
			Weapon:   "Rope",
			Location: "Kitchen",
		},
	}
}

func validSpec() LogicSpec {
	return LogicSpec{
		Evidence: []EvidenceMeaning{
			directEvidence(
				0,
				models.CategorySuspect,
				"Ava",
				models.CategoryWeapon,
				"Candlestick",
			),
			directEvidence(
				1,
				models.CategorySuspect,
				"Ben",
				models.CategoryWeapon,
				"Rope",
			),
			directEvidence(
				2,
				models.CategorySuspect,
				"Ava",
				models.CategoryLocation,
				"Study",
			),
			directEvidence(
				3,
				models.CategorySuspect,
				"Ben",
				models.CategoryLocation,
				"Kitchen",
			),
			directEvidence(
				4,
				models.CategorySuspect,
				"Cora",
				models.CategoryLocation,
				"Garden",
			),
		},
		Interviews: []InterviewMeaning{
			directInterview(
				0,
				models.CategorySuspect,
				"Cora",
				models.CategoryWeapon,
				"Knife",
			),
			directInterview(
				1,
				models.CategorySuspect,
				"Ava",
				models.CategoryWeapon,
				"Rope",
			),
			directInterview(
				2,
				models.CategorySuspect,
				"Ava",
				models.CategoryLocation,
				"Study",
			),
		},
	}
}

func directEvidence(
	index int,
	leftCategory models.Category,
	leftValue string,
	rightCategory models.Category,
	rightValue string,
) EvidenceMeaning {
	return EvidenceMeaning{
		ClueIndex: index,
		Left: models.EntitySelector{
			Category: leftCategory,
			Value:    leftValue,
		},
		Relation: models.RelationIs,
		Right: models.EntitySelector{
			Category: rightCategory,
			Value:    rightValue,
		},
	}
}

func directInterview(
	index int,
	leftCategory models.Category,
	leftValue string,
	rightCategory models.Category,
	rightValue string,
) InterviewMeaning {
	return InterviewMeaning{
		InterviewIndex: index,
		Left: models.EntitySelector{
			Category: leftCategory,
			Value:    leftValue,
		},
		Relation: models.RelationIs,
		Right: models.EntitySelector{
			Category: rightCategory,
			Value:    rightValue,
		},
	}
}

func clonePuzzleForTest(
	puzzle models.Puzzle,
) models.Puzzle {
	cloned := puzzle

	cloned.Suspects =
		append(
			[]string(nil),
			puzzle.Suspects...,
		)

	cloned.Weapons =
		append(
			[]string(nil),
			puzzle.Weapons...,
		)

	cloned.Locations =
		append(
			[]string(nil),
			puzzle.Locations...,
		)

	cloned.Clues =
		append(
			[]string(nil),
			puzzle.Clues...,
		)

	cloned.Interviews =
		append(
			[]models.Interview(nil),
			puzzle.Interviews...,
		)

	return cloned
}
