package generator

import (
	"fmt"
	"math/rand"

	"murdle/internal/models"
)

func SelectClues(
	config Config,
	candidates []models.LogicClue,
	random *rand.Rand,
) ([]models.LogicClue, error) {
	selected := make([]models.LogicClue, 0)
	remaining := append([]models.LogicClue(nil), candidates...)

	for {
		currentCount, _ := CountSolutions(config, selected, 2)

		if currentCount == 1 {
			return selected, nil
		}

		bestCount := -1
		bestIndexes := make([]int, 0)

		for index, candidate := range remaining {
			trial := append(
				append([]models.LogicClue(nil), selected...),
				candidate,
			)

			count, _ := CountSolutions(config, trial, 0)
			if count == 0 {
				continue
			}

			if bestCount == -1 || count < bestCount {
				bestCount = count
				bestIndexes = []int{index}
				continue
			}

			if count == bestCount {
				bestIndexes = append(bestIndexes, index)
			}
		}

		if len(bestIndexes) == 0 {
			return nil, fmt.Errorf(
				"no candidate clue can reduce the solution space",
			)
		}

		chosenIndex := bestIndexes[random.Intn(len(bestIndexes))]
		selected = append(selected, remaining[chosenIndex])
		remaining = append(
			remaining[:chosenIndex],
			remaining[chosenIndex+1:]...,
		)
	}
}

func MinimizeClues(
	config Config,
	clues []models.LogicClue,
) []models.LogicClue {
	result := append([]models.LogicClue(nil), clues...)

	for index := len(result) - 1; index >= 0; index-- {
		trial := make([]models.LogicClue, 0, len(result)-1)
		trial = append(trial, result[:index]...)
		trial = append(trial, result[index+1:]...)

		count, _ := CountSolutions(config, trial, 2)
		if count == 1 {
			result = trial
		}
	}

	return result
}
