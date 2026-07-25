package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"

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

func LoadPuzzles(dir string) ([]models.Puzzle, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var files []string

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}

		files = append(files, filepath.Join(dir, entry.Name()))
	}

	sort.Strings(files)

	puzzles := make([]models.Puzzle, 0, len(files))

	for _, file := range files {
		puzzle, err := LoadPuzzle(file)
		if err != nil {
			return nil, err
		}

		puzzles = append(puzzles, puzzle)
	}

	return puzzles, nil
}
