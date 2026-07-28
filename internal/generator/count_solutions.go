package generator

import "murdle/internal/models"

func CountSolutions(
	config Config,
	clues []models.LogicClue,
	limit int,
) (int, []map[string]models.Assignment) {
	weaponPermutations := permutations(config.Weapons)
	locationPermutations := permutations(config.Locations)
	motivePermutations := [][]string{nil}

	if len(config.Motives) > 0 {
		motivePermutations = permutations(config.Motives)
	}

	count := 0
	solutions := make([]map[string]models.Assignment, 0)

	for _, weapons := range weaponPermutations {
		for _, locations := range locationPermutations {
			for _, motives := range motivePermutations {
				assignments := buildAssignmentsFromPermutations(
					config,
					weapons,
					locations,
					motives,
				)

				if !allCluesSatisfied(assignments, clues) {
					continue
				}

				count++
				solutions = append(solutions, assignments)

				if limit > 0 && count >= limit {
					return count, solutions
				}
			}
		}
	}

	return count, solutions
}

func buildAssignmentsFromPermutations(
	config Config,
	weapons []string,
	locations []string,
	motives []string,
) map[string]models.Assignment {
	assignments := make(
		map[string]models.Assignment,
		len(config.Suspects),
	)

	for index, suspect := range config.Suspects {
		assignment := models.Assignment{
			Weapon:   weapons[index],
			Location: locations[index],
		}

		if len(config.Motives) > 0 {
			assignment.Motive = motives[index]
		}

		assignments[suspect] = assignment
	}

	return assignments
}
