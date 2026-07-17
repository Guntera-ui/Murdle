package storage

import (
	"encoding/json"
	"os"

	"murdle/internal/models"
)

func LoadPuzzle(path string) (models.Puzzle, error) {
	data, err := os.ReadFile(path)

	if err != nil {
		return models.Puzzle{}, err
	}

	puzzle := models.Puzzle{}

	err = json.Unmarshal(data, &puzzle)

	if err != nil {
		return models.Puzzle{}, err
	}

	return puzzle, nil
}
