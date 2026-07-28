package generator

import (
	"fmt"
	"math/rand"

	"murdle/internal/models"
)

func Generate(config Config) (models.Puzzle, error) {
	config = normalizeConfig(config)

	if err := ValidateConfig(config); err != nil {
		return models.Puzzle{}, err
	}

	var lastError error

	for attempt := 1; attempt <= config.MaxAttempts; attempt++ {
		attemptSeed := config.Seed + int64(attempt-1)*1_000_003
		random := rand.New(rand.NewSource(attemptSeed))

		assignments := GenerateAssignments(config, random)

		solution, err := BuildSolution(config.Culprit, assignments)
		if err != nil {
			return models.Puzzle{}, err
		}

		statements, err := GenerateStatements(
			config,
			assignments,
			random,
		)
		if err != nil {
			lastError = err
			continue
		}

		candidates := GenerateEvidenceCandidates(config, assignments)
		selected, err := SelectEvidenceClues(
			config,
			candidates,
			statements,
			random,
		)
		if err != nil {
			lastError = err
			continue
		}

		for index := range selected {
			selected[index].ID = fmt.Sprintf("clue-%03d", index+1)
			selected[index].Text = RenderClueText(selected[index])
			selected[index].Source = models.ClueSource{Type: "evidence"}
		}

		solutionCount, err := countMysterySolutionsOnly(
			config,
			selected,
			statements,
			2,
		)
		if err != nil {
			return models.Puzzle{}, err
		}

		if solutionCount != 1 {
			lastError = fmt.Errorf(
				"generated mystery has %d solutions",
				solutionCount,
			)
			continue
		}

		if !targetMysteryIsConsistent(
			assignments,
			config.Culprit,
			config.StatementRules,
			selected,
			statements,
		) {
			lastError = fmt.Errorf("target mystery failed its own constraints")
			continue
		}

		return buildPuzzle(
			config,
			assignments,
			solution,
			selected,
			statements,
			attempt,
		), nil
	}

	if lastError == nil {
		lastError = fmt.Errorf("generation attempts exhausted")
	}

	return models.Puzzle{}, fmt.Errorf(
		"could not generate a unique mystery after %d attempts: %w",
		config.MaxAttempts,
		lastError,
	)
}

func targetMysteryIsConsistent(
	assignments map[string]models.Assignment,
	culprit string,
	rules models.StatementRules,
	clues []models.LogicClue,
	statements []models.LogicStatement,
) bool {
	return allCluesSatisfied(assignments, clues) &&
		allStatementsConsistent(
			assignments,
			culprit,
			rules,
			statements,
		)
}

func buildPuzzle(
	config Config,
	assignments map[string]models.Assignment,
	solution models.Solution,
	clues []models.LogicClue,
	statements []models.LogicStatement,
	attempt int,
) models.Puzzle {
	displayClues := make([]string, 0, len(clues))

	for _, clue := range clues {
		displayClues = append(displayClues, clue.Text)
	}

	interviews := make([]models.Interview, 0, len(statements))

	for _, statement := range statements {
		interviews = append(interviews, models.Interview{
			Speaker:   statement.Speaker,
			Statement: statement.Text,
		})
	}

	return models.Puzzle{
		ID:             config.ID,
		CaseNumber:     config.CaseNumber,
		Title:          config.Title,
		Status:         config.Status,
		Description:    config.Description,
		Difficulty:     config.Difficulty,
		Victim:         config.Victim,
		IncidentReport: config.IncidentReport,
		Interviews:     interviews,

		Suspects:     append([]string(nil), config.Suspects...),
		SuspectIcons: cloneStringMap(config.SuspectIcons),
		Weapons:      append([]string(nil), config.Weapons...),
		Locations:    append([]string(nil), config.Locations...),
		Motives:      append([]string(nil), config.Motives...),

		SuspectDetails:  cloneEntityDetailsMap(config.SuspectDetails),
		WeaponDetails:   cloneEntityDetailsMap(config.WeaponDetails),
		LocationDetails: cloneEntityDetailsMap(config.LocationDetails),
		MotiveDetails:   cloneEntityDetailsMap(config.MotiveDetails),

		StatementRules:  config.StatementRules,
		LogicStatements: statements,
		Assignments:     cloneAssignments(assignments),
		Culprit:         config.Culprit,
		LogicClues:      clues,

		Generation: models.GenerationMetadata{
			Seed:                   config.Seed,
			GeneratorVersion:       "0.3.0",
			VerifiedUniqueSolution: true,
			SolutionCount:          1,
			EvidenceClueCount:      len(clues),
			StatementCount:         len(statements),
			Attempt:                attempt,
		},

		Clues:    displayClues,
		Solution: solution,
	}
}

func cloneStringMap(source map[string]string) map[string]string {
	if source == nil {
		return nil
	}

	result := make(map[string]string, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}

func cloneAssignments(
	source map[string]models.Assignment,
) map[string]models.Assignment {
	result := make(map[string]models.Assignment, len(source))
	for key, value := range source {
		result[key] = value
	}
	return result
}

func cloneEntityDetailsMap(
	source map[string]models.EntityDetails,
) map[string]models.EntityDetails {
	if source == nil {
		return nil
	}

	result := make(map[string]models.EntityDetails, len(source))

	for name, details := range source {
		cloned := models.EntityDetails{}

		if details.Attributes != nil {
			cloned.Attributes = make(
				map[string]models.AttributeValue,
				len(details.Attributes),
			)

			for attribute, value := range details.Attributes {
				cloned.Attributes[attribute] = value
			}
		}

		result[name] = cloned
	}

	return result
}
