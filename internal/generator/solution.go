package generator

import (
	"fmt"

	"murdle/internal/models"
)

func BuildSolution(
	culprit string,
	assignments map[string]models.Assignment,
) (models.Solution, error) {
	assignment, exists := assignments[culprit]

	if !exists {
		return models.Solution{}, fmt.Errorf(
			"culprit %q has no assignment",
			culprit,
		)
	}

	return models.Solution{
		Suspect:  culprit,
		Weapon:   assignment.Weapon,
		Location: assignment.Location,
		Motive:   assignment.Motive,
	}, nil
}
