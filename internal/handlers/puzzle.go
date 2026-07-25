package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"murdle/internal/storage"
)

func GetPuzzle(w http.ResponseWriter, r *http.Request) {

	id := strings.TrimPrefix(
		r.URL.Path,
		"/api/puzzle/",
	)

	filename :=
		"puzzles/" + id + ".json"

	puzzle, err :=
		storage.LoadPuzzle(filename)

	if err != nil {

		http.Error(
			w,
			"Puzzle not found",
			http.StatusNotFound,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(
		puzzle,
	)
}
