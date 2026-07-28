package generator

import "murdle/internal/models"

func ownerOf(
	assignments map[string]models.Assignment,
	ref models.EntityRef,
) (string, bool) {
	switch ref.Category {
	case models.CategorySuspect:
		_, exists := assignments[ref.Value]
		return ref.Value, exists

	case models.CategoryWeapon:
		for suspect, assignment := range assignments {
			if assignment.Weapon == ref.Value {
				return suspect, true
			}
		}

	case models.CategoryLocation:
		for suspect, assignment := range assignments {
			if assignment.Location == ref.Value {
				return suspect, true
			}
		}

	case models.CategoryMotive:
		for suspect, assignment := range assignments {
			if assignment.Motive == ref.Value {
				return suspect, true
			}
		}
	}

	return "", false
}

func clueSatisfied(
	assignments map[string]models.Assignment,
	clue models.LogicClue,
) bool {
	leftOwner, leftExists := ownerOf(assignments, clue.Left)
	rightOwner, rightExists := ownerOf(assignments, clue.Right)

	if !leftExists || !rightExists {
		return false
	}

	switch clue.Relation {
	case models.RelationIs:
		return leftOwner == rightOwner
	case models.RelationIsNot:
		return leftOwner != rightOwner
	default:
		return false
	}
}

func allCluesSatisfied(
	assignments map[string]models.Assignment,
	clues []models.LogicClue,
) bool {
	for _, clue := range clues {
		if !clueSatisfied(assignments, clue) {
			return false
		}
	}

	return true
}
