package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"murdle/internal/authoredvalidator"
	"murdle/internal/models"
)

const authoredValidationBodyLimit = 2 << 20

type authoredValidationRequest struct {
	Puzzle models.Puzzle               `json:"puzzle"`
	Logic  authoredvalidator.LogicSpec `json:"logic"`
}

type authoredValidationError struct {
	Error string `json:"error"`
}

func ValidateAuthoredMystery(
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		w.Header().Set(
			"Allow",
			http.MethodPost,
		)

		writeAuthoredValidationJSON(
			w,
			http.StatusMethodNotAllowed,
			authoredValidationError{
				Error: "method not allowed",
			},
		)

		return
	}

	r.Body =
		http.MaxBytesReader(
			w,
			r.Body,
			authoredValidationBodyLimit,
		)

	defer r.Body.Close()

	var request authoredValidationRequest

	decoder :=
		json.NewDecoder(
			r.Body,
		)

	if err :=
		decoder.Decode(
			&request,
		); err != nil {
		status :=
			http.StatusBadRequest

		var sizeError *http.MaxBytesError

		if errors.As(
			err,
			&sizeError,
		) {
			status =
				http.StatusRequestEntityTooLarge
		}

		writeAuthoredValidationJSON(
			w,
			status,
			authoredValidationError{
				Error: err.Error(),
			},
		)

		return
	}

	var extra any

	if err :=
		decoder.Decode(
			&extra,
		); !errors.Is(
		err,
		io.EOF,
	) {
		writeAuthoredValidationJSON(
			w,
			http.StatusBadRequest,
			authoredValidationError{
				Error: "request must contain one JSON object",
			},
		)

		return
	}

	report, err :=
		authoredvalidator.Validate(
			request.Puzzle,
			request.Logic,
		)

	if err != nil {
		writeAuthoredValidationJSON(
			w,
			http.StatusUnprocessableEntity,
			authoredValidationError{
				Error: err.Error(),
			},
		)

		return
	}

	writeAuthoredValidationJSON(
		w,
		http.StatusOK,
		report,
	)
}

func writeAuthoredValidationJSON(
	w http.ResponseWriter,
	status int,
	value any,
) {
	w.Header().Set(
		"Content-Type",
		"application/json; charset=utf-8",
	)

	w.WriteHeader(status)

	_ = json.NewEncoder(w).
		Encode(value)
}
