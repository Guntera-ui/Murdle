package generator

import (
	"testing"

	"murdle/internal/models"
)

func TestRenderClueTextPositiveSuspectWeapon(t *testing.T) {
	clue := models.LogicClue{
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
	}

	got := RenderClueText(clue)
	want := "Bego carried the Rock."

	if got != want {
		t.Fatalf(
			"expected %q, got %q",
			want,
			got,
		)
	}
}

func TestRenderClueTextNegativeSuspectLocation(t *testing.T) {
	clue := models.LogicClue{
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategorySuspect,
			Value:    "Marki",
		},
		Right: models.EntityRef{
			Category: models.CategoryLocation,
			Value:    "Warehouse",
		},
		Relation: models.RelationIsNot,
	}

	got := RenderClueText(clue)
	want := "Marki was not at the Warehouse."

	if got != want {
		t.Fatalf(
			"expected %q, got %q",
			want,
			got,
		)
	}
}

func TestRenderClueTextPositiveWeaponLocation(t *testing.T) {
	clue := models.LogicClue{
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategoryWeapon,
			Value:    "Crowbar",
		},
		Right: models.EntityRef{
			Category: models.CategoryLocation,
			Value:    "Garden",
		},
		Relation: models.RelationIs,
	}

	got := RenderClueText(clue)
	want := "The Crowbar was found at the Garden."

	if got != want {
		t.Fatalf(
			"expected %q, got %q",
			want,
			got,
		)
	}
}

func TestRenderClueTextUsesLowercaseMotive(t *testing.T) {
	clue := models.LogicClue{
		Type: models.ClueTypePair,
		Left: models.EntityRef{
			Category: models.CategorySuspect,
			Value:    "Baxi",
		},
		Right: models.EntityRef{
			Category: models.CategoryMotive,
			Value:    "Revenge",
		},
		Relation: models.RelationIs,
	}

	got := RenderClueText(clue)
	want := "Baxi acted out of revenge."

	if got != want {
		t.Fatalf(
			"expected %q, got %q",
			want,
			got,
		)
	}
}
