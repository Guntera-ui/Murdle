package generator

import (
	"fmt"
	"sort"
	"strings"

	"murdle/internal/models"
)

type selectorCandidate struct {
	name  string
	value models.AttributeValue
}

func ResolveSelector(
	config Config,
	selector models.EntitySelector,
) (models.EntityRef, error) {
	if selector.Value != "" {
		if !contains(categoryValues(config, selector.Category), selector.Value) {
			return models.EntityRef{}, fmt.Errorf(
				"%q does not exist in category %q",
				selector.Value,
				selector.Category,
			)
		}

		return models.EntityRef{
			Category: selector.Category,
			Value:    selector.Value,
		}, nil
	}

	if selector.Attribute == "" {
		return models.EntityRef{}, fmt.Errorf(
			"selector must contain either value or attribute",
		)
	}

	details := detailsForCategory(config, selector.Category)

	if selector.Rank > 0 {
		return resolveRankSelector(selector, details)
	}

	return resolveEqualsSelector(selector, details)
}

func detailsForCategory(
	config Config,
	category models.Category,
) map[string]models.EntityDetails {
	switch category {
	case models.CategorySuspect:
		return config.SuspectDetails
	case models.CategoryWeapon:
		return config.WeaponDetails
	case models.CategoryLocation:
		return config.LocationDetails
	case models.CategoryMotive:
		return config.MotiveDetails
	default:
		return nil
	}
}

func categoryValues(config Config, category models.Category) []string {
	switch category {
	case models.CategorySuspect:
		return config.Suspects
	case models.CategoryWeapon:
		return config.Weapons
	case models.CategoryLocation:
		return config.Locations
	case models.CategoryMotive:
		return config.Motives
	default:
		return nil
	}
}

func resolveEqualsSelector(
	selector models.EntitySelector,
	details map[string]models.EntityDetails,
) (models.EntityRef, error) {
	matches := make([]string, 0)

	for name, entity := range details {
		value, exists := entity.Attributes[selector.Attribute]
		if exists && selector.Equals.Kind != "" && attributeValuesEqual(value, selector.Equals) {
			matches = append(matches, name)
		}
	}

	if len(matches) != 1 {
		return models.EntityRef{}, fmt.Errorf(
			"selector for %q matched %d entities",
			selector.Attribute,
			len(matches),
		)
	}

	return models.EntityRef{
		Category: selector.Category,
		Value:    matches[0],
	}, nil
}

func resolveRankSelector(
	selector models.EntitySelector,
	details map[string]models.EntityDetails,
) (models.EntityRef, error) {
	if selector.Order != "ascending" && selector.Order != "descending" {
		return models.EntityRef{}, fmt.Errorf(
			"rank selector order must be ascending or descending",
		)
	}

	candidates := make([]selectorCandidate, 0)

	for name, entity := range details {
		value, exists := entity.Attributes[selector.Attribute]
		if !exists {
			continue
		}

		if value.Kind != models.AttributeNumber {
			return models.EntityRef{}, fmt.Errorf(
				"rank attribute %q must be numeric",
				selector.Attribute,
			)
		}

		candidates = append(candidates, selectorCandidate{
			name:  name,
			value: value,
		})
	}

	if selector.Rank < 1 || selector.Rank > len(candidates) {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d exceeds %d available entities",
			selector.Rank,
			len(candidates),
		)
	}

	sort.Slice(candidates, func(first int, second int) bool {
		left := candidates[first].value.Number
		right := candidates[second].value.Number

		if selector.Order == "descending" {
			return left > right
		}

		return left < right
	})

	selected := candidates[selector.Rank-1]

	if selector.Rank > 1 &&
		candidates[selector.Rank-2].value.Number == selected.value.Number {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d for attribute %q is ambiguous",
			selector.Rank,
			selector.Attribute,
		)
	}

	if selector.Rank < len(candidates) &&
		candidates[selector.Rank].value.Number == selected.value.Number {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d for attribute %q is ambiguous",
			selector.Rank,
			selector.Attribute,
		)
	}

	return models.EntityRef{
		Category: selector.Category,
		Value:    selected.name,
	}, nil
}

func attributeValuesEqual(
	first models.AttributeValue,
	second models.AttributeValue,
) bool {
	if first.Kind != second.Kind {
		return false
	}

	switch first.Kind {
	case models.AttributeString:
		return first.String == second.String
	case models.AttributeNumber:
		return first.Number == second.Number
	case models.AttributeBool:
		return first.Bool == second.Bool
	default:
		return false
	}
}

func selectorsForEntity(
	config Config,
	ref models.EntityRef,
) []models.EntitySelector {
	details := detailsForCategory(config, ref.Category)
	entity, exists := details[ref.Value]

	if !exists {
		return nil
	}

	result := make([]models.EntitySelector, 0)
	attributeNames := make([]string, 0, len(entity.Attributes))

	for attribute := range entity.Attributes {
		attributeNames = append(attributeNames, attribute)
	}

	sort.Strings(attributeNames)

	for _, attribute := range attributeNames {
		value := entity.Attributes[attribute]

		if value.Kind != models.AttributeNumber &&
			selectorValueIsUnique(details, attribute, value) {
			selector := models.EntitySelector{
				Category:  ref.Category,
				Attribute: attribute,
				Equals:    value,
			}
			selector.Phrase = equalitySelectorPhrase(selector)
			result = append(result, selector)
		}

		if value.Kind == models.AttributeNumber {
			for _, order := range []string{"ascending", "descending"} {
				rank, unique := numericRank(
					details,
					ref.Value,
					attribute,
					order,
				)

				if !unique {
					continue
				}

				selector := models.EntitySelector{
					Category:  ref.Category,
					Attribute: attribute,
					Rank:      rank,
					Order:     order,
				}
				selector.Phrase = rankSelectorPhrase(selector, len(details))
				result = append(result, selector)
			}
		}
	}

	return deduplicateSelectors(result)
}

func selectorValueIsUnique(
	details map[string]models.EntityDetails,
	attribute string,
	value models.AttributeValue,
) bool {
	matches := 0

	for _, entity := range details {
		candidate, exists := entity.Attributes[attribute]
		if exists && attributeValuesEqual(candidate, value) {
			matches++
		}
	}

	return matches == 1
}

func numericRank(
	details map[string]models.EntityDetails,
	name string,
	attribute string,
	order string,
) (int, bool) {
	candidates := make([]selectorCandidate, 0)

	for entityName, entity := range details {
		value, exists := entity.Attributes[attribute]
		if !exists || value.Kind != models.AttributeNumber {
			return 0, false
		}

		candidates = append(candidates, selectorCandidate{
			name:  entityName,
			value: value,
		})
	}

	sort.Slice(candidates, func(first int, second int) bool {
		left := candidates[first].value.Number
		right := candidates[second].value.Number

		if order == "descending" {
			return left > right
		}

		return left < right
	})

	for index, candidate := range candidates {
		if candidate.name != name {
			continue
		}

		if index > 0 &&
			candidates[index-1].value.Number == candidate.value.Number {
			return 0, false
		}

		if index+1 < len(candidates) &&
			candidates[index+1].value.Number == candidate.value.Number {
			return 0, false
		}

		return index + 1, true
	}

	return 0, false
}

func deduplicateSelectors(
	selectors []models.EntitySelector,
) []models.EntitySelector {
	seen := make(map[string]struct{})
	result := make([]models.EntitySelector, 0, len(selectors))

	for _, selector := range selectors {
		key := strings.ToLower(selector.Phrase)
		if key == "" {
			continue
		}

		if _, exists := seen[key]; exists {
			continue
		}

		seen[key] = struct{}{}
		result = append(result, selector)
	}

	return result
}

func equalitySelectorPhrase(selector models.EntitySelector) string {
	category := string(selector.Category)
	attribute := strings.ToLower(selector.Attribute)
	if selector.Equals.Kind == "" {
		return ""
	}

	value := selector.Equals

	if value.Kind == models.AttributeString {
		text := strings.TrimSpace(value.String)
		lower := strings.ToLower(text)

		switch attribute {
		case "zodiac", "sign", "star_sign":
			return "the " + text
		case "handedness", "hand":
			return "the " + lower + "-handed " + category
		case "hair", "haircolor", "hair_color":
			return "the " + lower + "-haired " + category
		case "eyecolor", "eye_color", "eyes":
			return "the " + lower + "-eyed " + category
		default:
			return "the " + lower + " " + category
		}
	}

	if value.Kind == models.AttributeBool {
		switch attribute {
		case "indoors", "indoor":
			if value.Bool {
				return "the indoor " + category
			}
			return "the outdoor " + category
		default:
			if value.Bool {
				return "the " + strings.ReplaceAll(attribute, "_", "-") + " " + category
			}
			return "the non-" + strings.ReplaceAll(attribute, "_", "-") + " " + category
		}
	}

	return fmt.Sprintf(
		"the %s with %s %.0f",
		category,
		strings.ReplaceAll(attribute, "_", " "),
		value.Number,
	)
}

func rankSelectorPhrase(selector models.EntitySelector, total int) string {
	category := string(selector.Category)
	attribute := strings.ToLower(selector.Attribute)
	ordinal := ordinalWord(selector.Rank)

	switch attribute {
	case "height":
		if selector.Order == "descending" {
			if selector.Rank == 1 {
				return "the tallest " + category
			}
			if selector.Rank == total {
				return "the shortest " + category
			}
			return "the " + ordinal + "-tallest " + category
		}

		if selector.Rank == 1 {
			return "the shortest " + category
		}
		if selector.Rank == total {
			return "the tallest " + category
		}
		return "the " + ordinal + "-shortest " + category

	case "weight":
		if selector.Order == "ascending" {
			if selector.Rank == 1 {
				return "the lightest " + category
			}
			if selector.Rank == total {
				return "the heaviest " + category
			}
			return "the " + ordinal + "-lightest " + category
		}

		if selector.Rank == 1 {
			return "the heaviest " + category
		}
		if selector.Rank == total {
			return "the lightest " + category
		}
		return "the " + ordinal + "-heaviest " + category

	case "age":
		if selector.Order == "descending" {
			if selector.Rank == 1 {
				return "the oldest " + category
			}
			return "the " + ordinal + "-oldest " + category
		}

		if selector.Rank == 1 {
			return "the youngest " + category
		}
		return "the " + ordinal + "-youngest " + category
	}

	direction := "lowest"
	if selector.Order == "descending" {
		direction = "highest"
	}

	return fmt.Sprintf(
		"the %s with the %s %s",
		category,
		ordinal+"-"+direction,
		strings.ReplaceAll(attribute, "_", " "),
	)
}

func ordinalWord(number int) string {
	words := map[int]string{
		1: "first",
		2: "second",
		3: "third",
		4: "fourth",
		5: "fifth",
	}

	if word, exists := words[number]; exists {
		return word
	}

	return fmt.Sprintf("%dth", number)
}
