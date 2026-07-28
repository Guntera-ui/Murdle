package generator

import (
	"testing"

	"murdle/internal/models"
)

func selectorConfig() Config {
	config := validConfig()

	config.SuspectDetails = map[string]models.EntityDetails{
		"Marki": {
			Attributes: map[string]models.AttributeValue{
				"height": {
					Kind:   models.AttributeNumber,
					Number: 58,
				},
				"zodiac": {
					Kind:   models.AttributeString,
					String: "Libra",
				},
			},
		},
		"Bego": {
			Attributes: map[string]models.AttributeValue{
				"height": {
					Kind:   models.AttributeNumber,
					Number: 65,
				},
				"zodiac": {
					Kind:   models.AttributeString,
					String: "Leo",
				},
			},
		},
		"Baxi": {
			Attributes: map[string]models.AttributeValue{
				"height": {
					Kind:   models.AttributeNumber,
					Number: 62,
				},
				"zodiac": {
					Kind:   models.AttributeString,
					String: "Virgo",
				},
			},
		},
	}

	return config
}

func TestResolveSelectorByDirectValue(t *testing.T) {
	config := selectorConfig()

	ref, err := ResolveSelector(
		config,
		models.EntitySelector{
			Category: models.CategorySuspect,
			Value:    "Bego",
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if ref.Value != "Bego" {
		t.Fatalf(
			"expected Bego, got %q",
			ref.Value,
		)
	}
}

func TestResolveSelectorByAttributeValue(t *testing.T) {
	config := selectorConfig()

	ref, err := ResolveSelector(
		config,
		models.EntitySelector{
			Category:  models.CategorySuspect,
			Attribute: "zodiac",
			Equals: models.AttributeValue{
				Kind:   models.AttributeString,
				String: "Libra",
			},
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if ref.Value != "Marki" {
		t.Fatalf(
			"expected Marki, got %q",
			ref.Value,
		)
	}
}

func TestResolveSelectorByDescendingRank(t *testing.T) {
	config := selectorConfig()

	ref, err := ResolveSelector(
		config,
		models.EntitySelector{
			Category:  models.CategorySuspect,
			Attribute: "height",
			Rank:      2,
			Order:     "descending",
		},
	)

	if err != nil {
		t.Fatal(err)
	}

	if ref.Value != "Baxi" {
		t.Fatalf(
			"expected Baxi as second tallest, got %q",
			ref.Value,
		)
	}
}

func TestResolveSelectorRejectsAmbiguousAttribute(t *testing.T) {
	config := selectorConfig()

	config.SuspectDetails["Bego"] = models.EntityDetails{
		Attributes: map[string]models.AttributeValue{
			"height": {
				Kind:   models.AttributeNumber,
				Number: 65,
			},
			"zodiac": {
				Kind:   models.AttributeString,
				String: "Libra",
			},
		},
	}

	_, err := ResolveSelector(
		config,
		models.EntitySelector{
			Category:  models.CategorySuspect,
			Attribute: "zodiac",
			Equals: models.AttributeValue{
				Kind:   models.AttributeString,
				String: "Libra",
			},
		},
	)

	if err == nil {
		t.Fatal(
			"expected ambiguous selector to return an error",
		)
	}
}
