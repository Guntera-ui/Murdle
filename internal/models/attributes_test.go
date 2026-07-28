package models

import (
	"encoding/json"
	"testing"
)

func TestEntitySelectorJSON(t *testing.T) {
	selector := EntitySelector{
		Category:  CategorySuspect,
		Attribute: "height",
		Rank:      2,
		Order:     "descending",
	}

	data, err := json.Marshal(selector)
	if err != nil {
		t.Fatalf("marshal selector: %v", err)
	}

	var decoded EntitySelector

	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("unmarshal selector: %v", err)
	}

	if decoded.Category != CategorySuspect {
		t.Fatalf(
			"expected category %q, got %q",
			CategorySuspect,
			decoded.Category,
		)
	}

	if decoded.Attribute != "height" {
		t.Fatalf(
			"expected attribute height, got %q",
			decoded.Attribute,
		)
	}

	if decoded.Rank != 2 {
		t.Fatalf(
			"expected rank 2, got %d",
			decoded.Rank,
		)
	}

	if decoded.Order != "descending" {
		t.Fatalf(
			"expected descending order, got %q",
			decoded.Order,
		)
	}
}

func TestEntityDetailsStoresFlexibleAttributes(t *testing.T) {
	details := EntityDetails{
		Attributes: map[string]AttributeValue{
			"height": {
				Kind:   AttributeNumber,
				Number: 62,
			},
			"handedness": {
				Kind:   AttributeString,
				String: "right",
			},
			"indoors": {
				Kind: AttributeBool,
				Bool: true,
			},
		},
	}

	if details.Attributes["height"].Number != 62 {
		t.Fatal("height attribute was not stored correctly")
	}

	if details.Attributes["handedness"].String != "right" {
		t.Fatal("handedness attribute was not stored correctly")
	}

	if !details.Attributes["indoors"].Bool {
		t.Fatal("indoors attribute was not stored correctly")
	}
}
