package generator

import (
	"fmt"
	"strings"
	"unicode"

	"murdle/internal/models"
)

func RenderClueText(clue models.LogicClue) string {
	left := clue.Left.Value
	right := clue.Right.Value

	if clue.LeftSelector != nil && clue.LeftSelector.Phrase != "" {
		left = clue.LeftSelector.Phrase
	}

	if clue.RightSelector != nil && clue.RightSelector.Phrase != "" {
		right = clue.RightSelector.Phrase
	}

	leftSubject := subjectPhrase(clue.Left.Category, left, clue.LeftSelector != nil)
	rightObject := objectPhrase(clue.Right.Category, right, clue.RightSelector != nil)

	if clue.Relation == models.RelationIs {
		switch {
		case clue.Left.Category == models.CategorySuspect &&
			clue.Right.Category == models.CategoryWeapon:
			return capitalize(leftSubject) + " carried " + rightObject + "."

		case clue.Left.Category == models.CategorySuspect &&
			clue.Right.Category == models.CategoryLocation:
			return capitalize(leftSubject) + " was seen at " + rightObject + "."

		case clue.Left.Category == models.CategorySuspect &&
			clue.Right.Category == models.CategoryMotive:
			return capitalize(leftSubject) + " acted out of " + motivePhrase(right, clue.RightSelector != nil) + "."

		case clue.Left.Category == models.CategoryWeapon &&
			clue.Right.Category == models.CategoryLocation:
			return capitalize(leftSubject) + " was found at " + rightObject + "."

		case clue.Left.Category == models.CategoryWeapon &&
			clue.Right.Category == models.CategoryMotive:
			return "The person carrying " + lowerInitial(leftSubject) +
				" acted out of " + motivePhrase(right, clue.RightSelector != nil) + "."

		case clue.Left.Category == models.CategoryLocation &&
			clue.Right.Category == models.CategoryMotive:
			return "The person at " + lowerInitial(leftSubject) +
				" acted out of " + motivePhrase(right, clue.RightSelector != nil) + "."
		}
	}

	switch {
	case clue.Left.Category == models.CategorySuspect &&
		clue.Right.Category == models.CategoryWeapon:
		return capitalize(leftSubject) + " did not carry " + rightObject + "."

	case clue.Left.Category == models.CategorySuspect &&
		clue.Right.Category == models.CategoryLocation:
		return capitalize(leftSubject) + " was not at " + rightObject + "."

	case clue.Left.Category == models.CategorySuspect &&
		clue.Right.Category == models.CategoryMotive:
		return capitalize(leftSubject) + " did not act out of " + motivePhrase(right, clue.RightSelector != nil) + "."

	case clue.Left.Category == models.CategoryWeapon &&
		clue.Right.Category == models.CategoryLocation:
		return capitalize(leftSubject) + " was not at " + rightObject + "."

	case clue.Left.Category == models.CategoryWeapon &&
		clue.Right.Category == models.CategoryMotive:
		return "The person carrying " + lowerInitial(leftSubject) +
			" did not act out of " + motivePhrase(right, clue.RightSelector != nil) + "."

	case clue.Left.Category == models.CategoryLocation &&
		clue.Right.Category == models.CategoryMotive:
		return "The person at " + lowerInitial(leftSubject) +
			" did not act out of " + motivePhrase(right, clue.RightSelector != nil) + "."

	default:
		return capitalize(leftSubject) + " was not connected to " + rightObject + "."
	}
}

func subjectPhrase(
	category models.Category,
	value string,
	isSelector bool,
) string {
	if isSelector || category == models.CategorySuspect {
		return value
	}

	return "the " + value
}

func objectPhrase(
	category models.Category,
	value string,
	isSelector bool,
) string {
	if isSelector {
		return value
	}

	if category == models.CategoryMotive {
		return strings.ToLower(value)
	}

	return "the " + value
}

func motivePhrase(value string, isSelector bool) string {
	if isSelector {
		return lowerInitial(value)
	}

	return strings.ToLower(value)
}

func capitalize(value string) string {
	if value == "" {
		return value
	}

	runes := []rune(value)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

func lowerInitial(value string) string {
	if value == "" {
		return value
	}

	if strings.HasPrefix(strings.ToLower(value), "the ") {
		return value
	}

	runes := []rune(value)
	runes[0] = unicode.ToLower(runes[0])
	return string(runes)
}

func formatStatementText(claim models.LogicClue) string {
	text := RenderClueText(claim)

	if text == "" {
		return fmt.Sprintf(
			"%s was connected to %s.",
			claim.Left.Value,
			claim.Right.Value,
		)
	}

	return text
}
