package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"murdle/internal/generator"
)

func main() {
	configPath := flag.String(
		"config",
		"configs/case-example.json",
		"input generator configuration",
	)

	outputPath := flag.String(
		"out",
		"puzzles/case-generated.json",
		"output puzzle JSON",
	)

	flag.Parse()

	configData, err := os.ReadFile(*configPath)
	if err != nil {
		fail("read config", err)
	}

	var config generator.Config

	if err := json.Unmarshal(configData, &config); err != nil {
		fail("parse config", err)
	}

	puzzle, err := generator.Generate(config)
	if err != nil {
		fail("generate puzzle", err)
	}

	outputData, err := json.MarshalIndent(puzzle, "", "    ")
	if err != nil {
		fail("encode puzzle", err)
	}

	if err := os.MkdirAll(filepath.Dir(*outputPath), 0755); err != nil {
		fail("create output directory", err)
	}

	if err := os.WriteFile(*outputPath, outputData, 0644); err != nil {
		fail("write puzzle", err)
	}

	fmt.Printf(
		"Generated %s with %d evidence clues and %d interviews.\n",
		*outputPath,
		len(puzzle.Clues),
		len(puzzle.Interviews),
	)
}

func fail(action string, err error) {
	fmt.Fprintf(os.Stderr, "%s: %v\n", action, err)
	os.Exit(1)
}
