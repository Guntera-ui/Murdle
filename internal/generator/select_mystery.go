package generator

import (
	"fmt"
	"math/rand"

	"murdle/internal/models"
)

func SelectEvidenceClues(
	config Config,
	candidates []models.LogicClue,
	statements []models.LogicStatement,
	random *rand.Rand,
) ([]models.LogicClue, error) {
	space, err := buildMysterySpace(config, statements)
	if err != nil {
		return nil, err
	}

	selected := make([]models.LogicClue, 0, config.MaxEvidenceClues)
	remaining := append([]models.LogicClue(nil), candidates...)
	active := append([]compactMysteryCandidate(nil), space.candidates...)

	for len(selected) < config.MaxEvidenceClues {
		currentCount := space.solutionCount(active, 0)

		if currentCount == 1 && len(selected) >= config.MinEvidenceClues {
			return selected, nil
		}

		counts, err := space.candidateCounts(
			active,
			remaining,
			currentCount,
		)
		if err != nil {
			return nil, err
		}

		bestCount := currentCount
		bestStyle := -1
		bestIndexes := make([]int, 0)

		for index, count := range counts {
			style := clueStyleScore(remaining[index])

			if count < bestCount {
				bestCount = count
				bestStyle = style
				bestIndexes = []int{index}
				continue
			}

			if count == bestCount && style > bestStyle {
				bestStyle = style
				bestIndexes = []int{index}
				continue
			}

			if count == bestCount && style == bestStyle {
				bestIndexes = append(bestIndexes, index)
			}
		}

		if len(bestIndexes) == 0 {
			return nil, fmt.Errorf(
				"no evidence clue reduced the mystery solution space",
			)
		}

		chosenIndex := bestIndexes[random.Intn(len(bestIndexes))]
		chosen := remaining[chosenIndex]
		compiledChosen, err := space.indexed.compileClue(chosen)
		if err != nil {
			return nil, err
		}

		selected = append(selected, chosen)
		active = space.filterByClue(active, compiledChosen)

		filtered := remaining[:0]
		for _, candidate := range remaining {
			if sameBaseFact(chosen, candidate) {
				continue
			}
			filtered = append(filtered, candidate)
		}
		remaining = filtered
	}

	if space.solutionCount(active, 2) != 1 {
		return nil, fmt.Errorf(
			"could not reach one solution within %d evidence clues",
			config.MaxEvidenceClues,
		)
	}

	return selected, nil
}
