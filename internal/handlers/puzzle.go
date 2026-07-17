package handlers

import (
	"encoding/json"
	"net/http"

	"murdle/internal/storage"
)

func GetTutorialPuzzle(w http.ResponseWriter, r *http.Request) {

	puzzle, err := storage.LoadPuzzle(
		"puzzles/tutorial.json",
	)

	if err != nil {
		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(puzzle)

}
