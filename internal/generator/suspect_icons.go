package generator

import (
	"errors"
	"fmt"
	"math/rand/v2"

	"murdle/internal/assets"
	"murdle/internal/models"
)

func EnsureSuspectIcons(puzzle *models.Puzzle) (bool, error) {

	modified := false

	if puzzle.SuspectIcons == nil {
		puzzle.SuspectIcons = make(map[string]string)
		modified = true
	}

	if err := validateIcons(puzzle); err != nil {
		return false, err
	}

	if removeUnusedIcons(puzzle) {
		modified = true
	}

	assigned, err := assignMissingIcons(puzzle)
	if err != nil {
		return false, err
	}

	if assigned {
		modified = true
	}

	return modified, nil
}

func validateIcons(p *models.Puzzle) error {

	valid := make(map[string]bool)

	for _, icon := range assets.SuspectIcons {
		valid[icon] = true
	}

	used := make(map[string]string)

	for suspect, icon := range p.SuspectIcons {

		if !valid[icon] {
			return fmt.Errorf(
				"invalid suspect icon %q for suspect %q",
				icon,
				suspect,
			)
		}

		if previous, exists := used[icon]; exists {
			return fmt.Errorf(
				"duplicate suspect icon %q used by %q and %q",
				icon,
				previous,
				suspect,
			)
		}

		used[icon] = suspect
	}

	return nil
}

func removeUnusedIcons(p *models.Puzzle) bool {

	exists := make(map[string]bool)

	for _, suspect := range p.Suspects {
		exists[suspect] = true
	}

	modified := false

	for suspect := range p.SuspectIcons {
		if !exists[suspect] {
			delete(p.SuspectIcons, suspect)
			modified = true
		}
	}

	return modified
}

func assignMissingIcons(p *models.Puzzle) (bool, error) {

	used := make(map[string]bool)

	for _, icon := range p.SuspectIcons {
		used[icon] = true
	}

	var available []string

	for _, icon := range assets.SuspectIcons {
		if !used[icon] {
			available = append(available, icon)
		}
	}

	missing := 0

	for _, suspect := range p.Suspects {
		if _, exists := p.SuspectIcons[suspect]; !exists {
			missing++
		}
	}

	if missing > len(available) {
		return false, errors.New("not enough suspect icons available")
	}

	rand.Shuffle(len(available), func(i, j int) {
		available[i], available[j] = available[j], available[i]
	})

	modified := false
	index := 0

	for _, suspect := range p.Suspects {

		if _, exists := p.SuspectIcons[suspect]; exists {
			continue
		}

		p.SuspectIcons[suspect] = available[index]
		index++
		modified = true
	}

	return modified, nil
}
