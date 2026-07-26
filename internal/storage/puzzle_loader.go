package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	"murdle/internal/generator"
	"murdle/internal/models"
)

func LoadPuzzle(path string) (models.Puzzle, error) {

	data, err := os.ReadFile(path)
	if err != nil {
		return models.Puzzle{}, fmt.Errorf("read file: %w", err)
	}

	var puzzle models.Puzzle

	if err := json.Unmarshal(data, &puzzle); err != nil {
		return models.Puzzle{}, fmt.Errorf("parse json: %w", err)
	}

	modified, err := generator.EnsureSuspectIcons(&puzzle)
	if err != nil {
		return models.Puzzle{}, fmt.Errorf("generate suspect icons: %w", err)
	}

	if modified {
		if err := SavePuzzle(path, puzzle); err != nil {
			return models.Puzzle{}, fmt.Errorf("save puzzle: %w", err)
		}
	}

	return puzzle, nil
}

func LoadPuzzles(dir string) ([]models.Puzzle, error) {

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read puzzle directory: %w", err)
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
			log.Printf(
				"[Puzzle Loader] Skipping %s\nReason: %v",
				file,
				err,
			)
			continue
		}

		puzzles = append(puzzles, puzzle)
	}

	if len(puzzles) == 0 {
		return nil, errors.New("no valid puzzles found")
	}

	return puzzles, nil
}

func SavePuzzle(path string, puzzle models.Puzzle) error {

	data, err := json.MarshalIndent(puzzle, "", "    ")
	if err != nil {
		return fmt.Errorf("marshal json: %w", err)
	}

	data = append(data, '\n')

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("write file: %w", err)
	}

	return nil
}
