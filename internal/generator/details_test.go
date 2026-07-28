package generator

import (
	"testing"

	"murdle/internal/models"
)

func TestGenerateCarriesEntityDetailsIntoPuzzle(t *testing.T) {
	config := validConfig()

	config.SuspectDetails = map[string]models.EntityDetails{
		"Marki": {
			Attributes: map[string]models.AttributeValue{
				"height": {
					Kind:   models.AttributeNumber,
					Number: 62,
				},
			},
		},
	}

	config.StatementRules = models.StatementRules{
		CulpritLies:        true,
		InnocentsTellTruth: true,
	}

	puzzle, err := Generate(config)
	if err != nil {
		t.Fatal(err)
	}

	height := puzzle.
		SuspectDetails["Marki"].
		Attributes["height"].
		Number

	if height != 62 {
		t.Fatalf(
			"expected Marki height 62, got %v",
			height,
		)
	}

	if !puzzle.StatementRules.CulpritLies {
		t.Fatal("expected culpritLies rule to be copied")
	}

	if !puzzle.StatementRules.InnocentsTellTruth {
		t.Fatal("expected innocentsTellTruth rule to be copied")
	}
}
