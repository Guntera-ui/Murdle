package generator

import (
	"math/rand"
	"testing"

	"murdle/internal/models"
)

func TestOwnerOfFindsEntityOwner(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	begoAssignment := assignments["Bego"]

	tests := []models.EntityRef{
		{
			Category: models.CategorySuspect,
			Value:    "Bego",
		},
		{
			Category: models.CategoryWeapon,
			Value:    begoAssignment.Weapon,
		},
		{
			Category: models.CategoryLocation,
			Value:    begoAssignment.Location,
		},
		{
			Category: models.CategoryMotive,
			Value:    begoAssignment.Motive,
		},
	}

	for _, ref := range tests {
		owner, exists := ownerOf(
			assignments,
			ref,
		)

		if !exists {
			t.Fatalf(
				"expected %q to have an owner",
				ref.Value,
			)
		}

		if owner != "Bego" {
			t.Fatalf(
				"expected owner Bego for %q, got %q",
				ref.Value,
				owner,
			)
		}
	}
}

func TestClueSatisfiedAcceptsTruePositiveClue(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	begoAssignment := assignments["Bego"]

	clue := models.LogicClue{
		ID:   "clue-001",
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategorySuspect,
			Value:    "Bego",
		},
		Right: models.EntityRef{
			Category: models.CategoryWeapon,
			Value:    begoAssignment.Weapon,
		},
		Relation: models.RelationIs,
	}

	if !clueSatisfied(assignments, clue) {
		t.Fatal("expected true positive clue to be satisfied")
	}
}

func TestClueSatisfiedAcceptsTrueNegativeClue(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	begoAssignment := assignments["Bego"]

	var otherSuspect string

	for _, suspect := range config.Suspects {
		if suspect != "Bego" {
			otherSuspect = suspect
			break
		}
	}

	clue := models.LogicClue{
		ID:   "clue-002",
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategorySuspect,
			Value:    otherSuspect,
		},
		Right: models.EntityRef{
			Category: models.CategoryWeapon,
			Value:    begoAssignment.Weapon,
		},
		Relation: models.RelationIsNot,
	}

	if !clueSatisfied(assignments, clue) {
		t.Fatal("expected true negative clue to be satisfied")
	}
}

func TestClueSatisfiedRejectsFalseClue(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	begoAssignment := assignments["Bego"]

	var otherSuspect string

	for _, suspect := range config.Suspects {
		if suspect != "Bego" {
			otherSuspect = suspect
			break
		}
	}

	clue := models.LogicClue{
		ID:   "clue-003",
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategorySuspect,
			Value:    otherSuspect,
		},
		Right: models.EntityRef{
			Category: models.CategoryWeapon,
			Value:    begoAssignment.Weapon,
		},
		Relation: models.RelationIs,
	}

	if clueSatisfied(assignments, clue) {
		t.Fatal("expected false clue to be rejected")
	}
}
