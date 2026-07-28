package generator

import (
	"fmt"
	"sort"

	"murdle/internal/models"
)

var categoryPairs = [][2]models.Category{
	{models.CategorySuspect, models.CategoryWeapon},
	{models.CategorySuspect, models.CategoryLocation},
	{models.CategorySuspect, models.CategoryMotive},
	{models.CategoryWeapon, models.CategoryLocation},
	{models.CategoryWeapon, models.CategoryMotive},
	{models.CategoryLocation, models.CategoryMotive},
}

func GenerateCandidateClues(
	config Config,
	assignments map[string]models.Assignment,
) []models.LogicClue {
	return GenerateDirectCandidateClues(config, assignments)
}

func GenerateDirectCandidateClues(
	config Config,
	assignments map[string]models.Assignment,
) []models.LogicClue {
	clues := make([]models.LogicClue, 0)
	clueNumber := 1

	for _, pair := range categoryPairs {
		leftValues := categoryValues(config, pair[0])
		rightValues := categoryValues(config, pair[1])

		if len(leftValues) == 0 || len(rightValues) == 0 {
			continue
		}

		for _, leftValue := range leftValues {
			for _, rightValue := range rightValues {
				left := models.EntityRef{
					Category: pair[0],
					Value:    leftValue,
				}
				right := models.EntityRef{
					Category: pair[1],
					Value:    rightValue,
				}

				leftOwner, _ := ownerOf(assignments, left)
				rightOwner, _ := ownerOf(assignments, right)
				relation := models.RelationIsNot

				if leftOwner == rightOwner {
					relation = models.RelationIs
				}

				clues = append(clues, models.LogicClue{
					ID:       fmt.Sprintf("candidate-%03d", clueNumber),
					Type:     models.ClueTypePair,
					Left:     left,
					Right:    right,
					Relation: relation,
					Source: models.ClueSource{
						Type: "evidence",
					},
				})

				clueNumber++
			}
		}
	}

	return clues
}

func GenerateEvidenceCandidates(
	config Config,
	assignments map[string]models.Assignment,
) []models.LogicClue {
	direct := GenerateDirectCandidateClues(config, assignments)
	result := make([]models.LogicClue, 0, len(direct)*3)
	seen := make(map[string]struct{})

	add := func(clue models.LogicClue) {
		key := evidenceClueKey(clue)
		if _, exists := seen[key]; exists {
			return
		}

		seen[key] = struct{}{}
		result = append(result, clue)
	}

	for _, clue := range direct {
		for _, selector := range selectorsForEntity(config, clue.Left) {
			candidate := clue
			selectorCopy := selector
			candidate.LeftSelector = &selectorCopy
			add(candidate)
		}

		for _, selector := range selectorsForEntity(config, clue.Right) {
			candidate := clue
			selectorCopy := selector
			candidate.RightSelector = &selectorCopy
			add(candidate)
		}

		add(clue)
	}

	sort.SliceStable(result, func(first int, second int) bool {
		return clueStyleScore(result[first]) > clueStyleScore(result[second])
	})

	return result
}

func evidenceClueKey(clue models.LogicClue) string {
	leftSelector := ""
	rightSelector := ""

	if clue.LeftSelector != nil {
		leftSelector = clue.LeftSelector.Phrase
	}

	if clue.RightSelector != nil {
		rightSelector = clue.RightSelector.Phrase
	}

	return fmt.Sprintf(
		"%s|%s|%s|%s|%s|%s|%s",
		clue.Left.Category,
		clue.Left.Value,
		clue.Right.Category,
		clue.Right.Value,
		clue.Relation,
		leftSelector,
		rightSelector,
	)
}

func clueStyleScore(clue models.LogicClue) int {
	score := 0

	for _, selector := range []*models.EntitySelector{
		clue.LeftSelector,
		clue.RightSelector,
	} {
		if selector == nil {
			continue
		}

		if selector.Rank > 0 {
			score += 6
			continue
		}

		if selector.Equals.Kind != "" {
			switch selector.Equals.Kind {
			case models.AttributeString:
				score += 5
			case models.AttributeBool:
				score += 4
			default:
				score += 2
			}
		}
	}

	if clue.Relation == models.RelationIsNot {
		score++
	}

	return score
}

func sameBaseFact(first models.LogicClue, second models.LogicClue) bool {
	return first.Left == second.Left &&
		first.Right == second.Right &&
		first.Relation == second.Relation
}

func invertRelation(relation models.Relation) models.Relation {
	if relation == models.RelationIs {
		return models.RelationIsNot
	}

	return models.RelationIs
}
