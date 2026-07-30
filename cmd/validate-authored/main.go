package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"murdle/internal/authoredvalidator"
	"murdle/internal/models"
)

func main() {
	casePath := flag.String(
		"case",
		"examples/case11-valid.json",
		"human-authored puzzle JSON",
	)

	logicPath := flag.String(
		"logic",
		"examples/case11-valid.logic.json",
		"hidden solver-meaning JSON",
	)

	outputPath := flag.String(
		"out",
		"",
		"optional validation report path",
	)

	flag.Parse()

	var puzzle models.Puzzle

	if err := readJSON(
		*casePath,
		&puzzle,
	); err != nil {
		fail(
			"read case",
			err,
		)
	}

	var spec authoredvalidator.LogicSpec

	if err := readJSON(
		*logicPath,
		&spec,
	); err != nil {
		fail(
			"read logic",
			err,
		)
	}

	report, err :=
		authoredvalidator.Validate(
			puzzle,
			spec,
		)

	if err != nil {
		fail(
			"validate authored mystery",
			err,
		)
	}

	data, err :=
		json.MarshalIndent(
			report,
			"",
			"    ",
		)

	if err != nil {
		fail(
			"encode report",
			err,
		)
	}

	fmt.Println(
		string(data),
	)

	if *outputPath != "" {
		if err :=
			os.MkdirAll(
				filepath.Dir(
					*outputPath,
				),
				0755,
			); err != nil {
			fail(
				"create report directory",
				err,
			)
		}

		if err :=
			os.WriteFile(
				*outputPath,
				data,
				0644,
			); err != nil {
			fail(
				"write report",
				err,
			)
		}
	}

	if !report.Valid {
		os.Exit(2)
	}
}

func readJSON(
	path string,
	target any,
) error {
	data, err :=
		os.ReadFile(path)

	if err != nil {
		return err
	}

	if err :=
		json.Unmarshal(
			data,
			target,
		); err != nil {
		return err
	}

	return nil
}

func fail(
	action string,
	err error,
) {
	fmt.Fprintf(
		os.Stderr,
		"%s: %v\n",
		action,
		err,
	)

	os.Exit(1)
}
