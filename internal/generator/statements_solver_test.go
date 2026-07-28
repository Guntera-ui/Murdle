package generator

import (
	"testing"

	"murdle/internal/models"
)

func TestStatementConsistentForTruthfulInnocent(t *testing.T) {
	assignments := map[string]models.Assignment{
		"Marki": {
			Weapon:   "Brick",
			Location: "Warehouse",
			Motive:   "Revenge",
		},
		"Bego": {
			Weapon:   "Rock",
			Location: "Garden",
			Motive:   "Jealousy",
		},
		"Baxi": {
			Weapon:   "Crowbar",
			Location: "House",
			Motive:   "Greed",
		},
	}

	statement := models.LogicStatement{
		Speaker: "Marki",
		Claim: models.LogicClue{
			Type: models.ClueTypePair,
			Left: models.EntityRef{
				Category: models.CategorySuspect,
				Value:    "Marki",
			},
			Right: models.EntityRef{
				Category: models.CategoryWeapon,
				Value:    "Brick",
			},
			Relation: models.RelationIs,
		},
	}

	rules := models.StatementRules{
		CulpritLies:        true,
		InnocentsTellTruth: true,
	}

	if !statementConsistent(
		assignments,
		"Bego",
		rules,
		statement,
	) {
		t.Fatal(
			"expected truthful innocent statement to be consistent",
		)
	}
}

func TestStatementConsistentForLyingCulprit(t *testing.T) {
	assignments := map[string]models.Assignment{
		"Marki": {
			Weapon:   "Brick",
			Location: "Warehouse",
			Motive:   "Revenge",
		},
		"Bego": {
			Weapon:   "Rock",
			Location: "Garden",
			Motive:   "Jealousy",
		},
		"Baxi": {
			Weapon:   "Crowbar",
			Location: "House",
			Motive:   "Greed",
		},
	}

	statement := models.LogicStatement{
		Speaker: "Bego",
		Claim: models.LogicClue{
			Type: models.ClueTypePair,
			Left: models.EntityRef{
				Category: models.CategorySuspect,
				Value:    "Bego",
			},
			Right: models.EntityRef{
				Category: models.CategoryWeapon,
				Value:    "Brick",
			},
			Relation: models.RelationIs,
		},
	}

	rules := models.StatementRules{
		CulpritLies:        true,
		InnocentsTellTruth: true,
	}

	if !statementConsistent(
		assignments,
		"Bego",
		rules,
		statement,
	) {
		t.Fatal(
			"expected false culprit statement to be consistent",
		)
	}
}

func TestStatementRejectsTruthfulCulpritWhenCulpritMustLie(
	t *testing.T,
) {
	assignments := map[string]models.Assignment{
		"Bego": {
			Weapon:   "Rock",
			Location: "Garden",
			Motive:   "Jealousy",
		},
	}

	statement := models.LogicStatement{
		Speaker: "Bego",
		Claim: models.LogicClue{
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
	}

	rules := models.StatementRules{
		CulpritLies:        true,
		InnocentsTellTruth: true,
	}

	if statementConsistent(
		assignments,
		"Bego",
		rules,
		statement,
	) {
		t.Fatal(
			"expected truthful culprit statement to be inconsistent",
		)
	}
}
