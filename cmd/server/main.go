package main

import (
	"fmt"
	"net/http"

	"murdle/internal/handlers"
)

func main() {
	fs := http.FileServer(http.Dir("./web"))

	http.Handle("/", fs)

	http.HandleFunc(
		"/api/puzzle/",
		handlers.GetPuzzle,
	)

	fmt.Println("Server running on :8080")

	http.ListenAndServe(":8080", nil)
}
