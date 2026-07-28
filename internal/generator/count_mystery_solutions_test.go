package generator

import (
	"testing"

	"murdle/internal/models"
)

func TestCountMysterySolutionsUsesStatementsToFindCulprit(
	t *testing.T,
) {
	config := validConfig()

	config.StatementRules = models.StatementRules{
		CulpritLies:        true,
		InnocentsTellTruth: true,
	}

	clues := []models.LogicClue{
		{
			Type: models.ClueTypePair,
			Left: models.EntityRef{
				Category: models.CategorySuspect,
				Value:    "Marki",
			},
			Right: models.EntityRef{
				Category: models.CategoryWeapon,
				Value:    "Crowbar",
			},
			Relation: models.RelationIs,
		},
		{
			Type: models.ClueTypePair,
			Left: models.EntityRef{
				Category: models.CategorySuspect,
				Value:    "Bego",
			},
			Right: models.EntityRef{
				Category: models.CategoryWeapon,
				Value:    "Rock",
			},
			Relation: models.RelationIs,
		},
		{
			Type: models.ClueTypePair,
			Left: models.EntityRef{
				Category: models.CategorySuspect,
				Value:    "Baxi",
			},
			Right: models.EntityRef{
				Category: models.CategoryWeapon,
				Value:    "Brick",
			},
			Relation: models.RelationIs,
		},
	}

	statements := []models.LogicStatement{
		{
			Speaker: "Marki",
			Claim: models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    "Marki",
				},
				Right: models.EntityRef{
					Category: models.CategoryWeapon,
					Value:    "Crowbar",
				},
				Relation: models.RelationIs,
			},
		},
		{
			Speaker: "Bego",
			Claim: models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    "Bego",
				},
				Right: models.EntityRef{
					Category: models.CategoryWeapon,
					Value:    "Crowbar",
				},
				Relation: models.RelationIs,
			},
		},
		{
			Speaker: "Baxi",
			Claim: models.LogicClue{
				Type: models.ClueTypePair,
				Left: models.EntityRef{
					Category: models.CategorySuspect,
					Value:    "Baxi",
				},
				Right: models.EntityRef{
					Category: models.CategoryWeapon,
					Value:    "Brick",
				},
				Relation: models.RelationIs,
			},
		},
	}

	count, solutions := CountMysterySolutions(
		config,
		clues,
		statements,
		0,
	)

	if count != 36 {
		t.Fatalf(
			"expected 36 grid-and-culprit solutions, got %d",
			count,
		)
	}

	for _, solution := range solutions {
		if solution.Culprit != "Bego" {
			t.Fatalf(
				"expected only Bego as culprit, got %q",
				solution.Culprit,
			)
		}
	}
}

func TestCountMysterySolutionsStopsAtLimit(t *testing.T) {
	config := validConfig()

	count, solutions := CountMysterySolutions(
		config,
		nil,
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
			"expected 2 solutions, got %d",
			len(solutions),
		)
	}
}
