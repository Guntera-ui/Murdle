package handlers

import (
	"encoding/json"
	"net/http"

	"murdle/internal/storage"
)

type CaseSummary struct {
	ID          int    `json:"id"`
	CaseNumber  string `json:"caseNumber"`
	Title       string `json:"title"`
	Status      string `json:"status"`
	Description string `json:"description"`
	Difficulty  string `json:"difficulty"`

	Suspects  int `json:"suspects"`
	Weapons   int `json:"weapons"`
	Locations int `json:"locations"`
	Clues     int `json:"clues"`
}

func GetCases(w http.ResponseWriter, r *http.Request) {
	puzzles, err := storage.LoadPuzzles("puzzles")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	summaries := make([]CaseSummary, 0, len(puzzles))

	for _, puzzle := range puzzles {
		summaries = append(summaries, CaseSummary{
			ID:          puzzle.ID,
			CaseNumber:  puzzle.CaseNumber,
			Title:       puzzle.Title,
			Status:      puzzle.Status,
			Description: puzzle.Description,
			Difficulty:  puzzle.Difficulty,

			Suspects:  len(puzzle.Suspects),
			Weapons:   len(puzzle.Weapons),
			Locations: len(puzzle.Locations),
			Clues:     len(puzzle.Clues),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summaries)
}
