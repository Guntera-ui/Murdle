package models

import "encoding/json"

type AttributeKind string

const (
	AttributeString AttributeKind = "string"
	AttributeNumber AttributeKind = "number"
	AttributeBool   AttributeKind = "bool"
)

type AttributeValue struct {
	Kind   AttributeKind `json:"kind"`
	String string        `json:"string,omitempty"`
	Number float64       `json:"number,omitempty"`
	Bool   bool          `json:"bool,omitempty"`
}

func (value AttributeValue) MarshalJSON() ([]byte, error) {
	switch value.Kind {
	case AttributeString:
		return json.Marshal(struct {
			Kind   AttributeKind `json:"kind"`
			String string        `json:"string"`
		}{value.Kind, value.String})
	case AttributeNumber:
		return json.Marshal(struct {
			Kind   AttributeKind `json:"kind"`
			Number float64       `json:"number"`
		}{value.Kind, value.Number})
	case AttributeBool:
		return json.Marshal(struct {
			Kind AttributeKind `json:"kind"`
			Bool bool          `json:"bool"`
		}{value.Kind, value.Bool})
	default:
		return json.Marshal(struct {
			Kind AttributeKind `json:"kind"`
		}{value.Kind})
	}
}

type EntityDetails struct {
	Attributes map[string]AttributeValue `json:"attributes,omitempty"`
}

type EntitySelector struct {
	Category  Category       `json:"category"`
	Value     string         `json:"value,omitempty"`
	Attribute string         `json:"attribute,omitempty"`
	Equals    AttributeValue `json:"equals,omitempty"`
	Rank      int            `json:"rank,omitempty"`
	Order     string         `json:"order,omitempty"`
	Phrase    string         `json:"phrase,omitempty"`
}

func (selector EntitySelector) MarshalJSON() ([]byte, error) {
	result := map[string]any{
		"category": selector.Category,
	}

	if selector.Value != "" {
		result["value"] = selector.Value
	}

	if selector.Attribute != "" {
		result["attribute"] = selector.Attribute
	}

	if selector.Equals.Kind != "" {
		result["equals"] = selector.Equals
	}

	if selector.Rank > 0 {
		result["rank"] = selector.Rank
	}

	if selector.Order != "" {
		result["order"] = selector.Order
	}

	if selector.Phrase != "" {
		result["phrase"] = selector.Phrase
	}

	return json.Marshal(result)
}

type StatementRules struct {
	CulpritLies        bool `json:"culpritLies"`
	InnocentsTellTruth bool `json:"innocentsTellTruth"`
}
