package main

import (
	"fmt"
	"log"
	"net/http"

	"murdle/internal/handlers"
)

func main() {
	fs := http.FileServer(
		http.Dir("./web"),
	)

	http.Handle("/", fs)

	http.HandleFunc(
		"/api/puzzle/",
		handlers.GetPuzzle,
	)

	http.HandleFunc(
		"/api/cases",
		handlers.GetCases,
	)

	http.HandleFunc(
		"/api/authored-mystery/validate",
		handlers.ValidateAuthoredMystery,
	)

	fmt.Println(
		"Server running on :8080",
	)

	if err := http.ListenAndServe(
		":8080",
		nil,
	); err != nil {
		log.Fatal(err)
	}
}
