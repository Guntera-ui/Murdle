package generator

import (
	"math/rand"

	"murdle/internal/models"
)

func GenerateAssignments(
	config Config,
	random *rand.Rand,
) map[string]models.Assignment {
	weapons := shuffledCopy(config.Weapons, random)
	locations := shuffledCopy(config.Locations, random)
	motives := shuffledCopy(config.Motives, random)

	assignments := make(
		map[string]models.Assignment,
		len(config.Suspects),
	)

	for index, suspect := range config.Suspects {
		assignment := models.Assignment{
			Weapon:   weapons[index],
			Location: locations[index],
		}

		if len(motives) > 0 {
			assignment.Motive = motives[index]
		}

		assignments[suspect] = assignment
	}

	return assignments
}

func shuffledCopy(values []string, random *rand.Rand) []string {
	result := append([]string(nil), values...)

	random.Shuffle(
		len(result),
		func(first int, second int) {
			result[first], result[second] = result[second], result[first]
		},
	)

	return result
}
