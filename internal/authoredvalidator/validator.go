package authoredvalidator

import (
	"fmt"
	"sort"
	"strings"

	"murdle/internal/generator"
	"murdle/internal/models"
)

func Validate(
	puzzle models.Puzzle,
	spec LogicSpec,
) (Report, error) {
	if err := validatePuzzleStructure(puzzle); err != nil {
		return Report{}, err
	}

	rules := puzzle.StatementRules
	warnings := make([]string, 0)

	if len(spec.Interviews) > 0 &&
		!rules.CulpritLies &&
		!rules.InnocentsTellTruth {
		rules = models.StatementRules{
			CulpritLies:        true,
			InnocentsTellTruth: true,
		}

		warnings = append(
			warnings,
			"Statement rules were omitted, so the validator used culpritLies=true and innocentsTellTruth=true.",
		)
	}

	config := generator.Config{
		ID:               puzzle.ID,
		Seed:             int64(puzzle.ID),
		CaseNumber:       puzzle.CaseNumber,
		Title:            puzzle.Title,
		Status:           puzzle.Status,
		Description:      puzzle.Description,
		Difficulty:       puzzle.Difficulty,
		Victim:           puzzle.Victim,
		IncidentReport:   puzzle.IncidentReport,
		Suspects:         append([]string(nil), puzzle.Suspects...),
		SuspectIcons:     cloneStringMap(puzzle.SuspectIcons),
		Weapons:          append([]string(nil), puzzle.Weapons...),
		Locations:        append([]string(nil), puzzle.Locations...),
		Motives:          append([]string(nil), puzzle.Motives...),
		SuspectDetails:   cloneDetails(puzzle.SuspectDetails),
		WeaponDetails:    cloneDetails(puzzle.WeaponDetails),
		LocationDetails:  cloneDetails(puzzle.LocationDetails),
		MotiveDetails:    cloneDetails(puzzle.MotiveDetails),
		StatementRules:   rules,
		Culprit:          puzzle.Solution.Suspect,
		MinEvidenceClues: 1,
		MaxEvidenceClues: 10,
		MaxAttempts:      1,
	}

	clues, usedClueIndexes, err :=
		compileEvidence(
			puzzle,
			spec.Evidence,
		)

	if err != nil {
		return Report{}, err
	}

	statements, usedInterviewIndexes, err :=
		compileInterviews(
			puzzle,
			spec.Interviews,
		)

	if err != nil {
		return Report{}, err
	}

	count, solutions :=
		generator.CountMysterySolutions(
			config,
			clues,
			statements,
			2,
		)

	report := Report{
		IntendedSolution:          puzzle.Solution,
		SolutionsFound:            count,
		SolutionCountIsLowerBound: count >= 2,
		UsedEvidence:              len(clues),
		UsedInterviews:            len(statements),
		NarrativeOnlyClues:        missingIndexes(len(puzzle.Clues), usedClueIndexes),
		NarrativeOnlyInterviews:   missingIndexes(len(puzzle.Interviews), usedInterviewIndexes),
		Warnings:                  warnings,
	}

	for _, solution := range solutions {
		assignment :=
			solution.Assignments[solution.Culprit]

		report.Candidates = append(
			report.Candidates,
			CandidateSolution{
				Culprit:     solution.Culprit,
				Weapon:      assignment.Weapon,
				Location:    assignment.Location,
				Motive:      assignment.Motive,
				Assignments: cloneAssignments(solution.Assignments),
			},
		)
	}

	switch {
	case count == 0:
		report.Status =
			StatusContradictory

	case count >= 2:
		report.Status =
			StatusAmbiguous

	default:
		report.Unique = true

		candidate :=
			report.Candidates[0]

		report.MatchesIntendedSolution =
			matchesSolution(
				puzzle.Solution,
				candidate,
			)

		if report.MatchesIntendedSolution {
			report.Status =
				StatusUnique

			report.Valid = true
		} else {
			report.Status =
				StatusUniqueWrongSolution
		}
	}

	if len(clues) == 0 {
		report.Warnings = append(
			report.Warnings,
			"No evidence clue has solver meaning.",
		)
	}

	if len(statements) == 0 {
		report.Warnings = append(
			report.Warnings,
			"No interview has solver meaning, so testimony cannot identify the culprit.",
		)
	}

	return report, nil
}

func compileEvidence(
	puzzle models.Puzzle,
	meanings []EvidenceMeaning,
) ([]models.LogicClue, map[int]struct{}, error) {
	result := make(
		[]models.LogicClue,
		0,
		len(meanings),
	)

	used := make(
		map[int]struct{},
		len(meanings),
	)

	for index, meaning := range meanings {
		if meaning.ClueIndex < 0 ||
			meaning.ClueIndex >= len(puzzle.Clues) {
			return nil, nil, fmt.Errorf(
				"evidence meaning %d refers to clue index %d, but the case has %d clues",
				index,
				meaning.ClueIndex,
				len(puzzle.Clues),
			)
		}

		clue, err :=
			compileClaim(
				puzzle,
				fmt.Sprintf(
					"authored-evidence-%03d",
					index+1,
				),
				puzzle.Clues[meaning.ClueIndex],
				"evidence",
				"",
				meaning.Left,
				meaning.Relation,
				meaning.Right,
			)

		if err != nil {
			return nil, nil, fmt.Errorf(
				"evidence meaning %d: %w",
				index,
				err,
			)
		}

		result = append(
			result,
			clue,
		)

		used[meaning.ClueIndex] =
			struct{}{}
	}

	return result, used, nil
}

func compileInterviews(
	puzzle models.Puzzle,
	meanings []InterviewMeaning,
) ([]models.LogicStatement, map[int]struct{}, error) {
	result := make(
		[]models.LogicStatement,
		0,
		len(meanings),
	)

	used := make(
		map[int]struct{},
		len(meanings),
	)

	for index, meaning := range meanings {
		if meaning.InterviewIndex < 0 ||
			meaning.InterviewIndex >= len(puzzle.Interviews) {
			return nil, nil, fmt.Errorf(
				"interview meaning %d refers to interview index %d, but the case has %d interviews",
				index,
				meaning.InterviewIndex,
				len(puzzle.Interviews),
			)
		}

		interview :=
			puzzle.Interviews[meaning.InterviewIndex]

		claim, err :=
			compileClaim(
				puzzle,
				fmt.Sprintf(
					"authored-statement-claim-%03d",
					index+1,
				),
				interview.Statement,
				"interview",
				interview.Speaker,
				meaning.Left,
				meaning.Relation,
				meaning.Right,
			)

		if err != nil {
			return nil, nil, fmt.Errorf(
				"interview meaning %d: %w",
				index,
				err,
			)
		}

		result = append(
			result,
			models.LogicStatement{
				ID: fmt.Sprintf(
					"authored-statement-%03d",
					index+1,
				),
				Speaker: interview.Speaker,
				Text:    interview.Statement,
				Claim:   claim,
			},
		)

		used[meaning.InterviewIndex] =
			struct{}{}
	}

	return result, used, nil
}

func compileClaim(
	puzzle models.Puzzle,
	id string,
	text string,
	sourceType string,
	speaker string,
	leftSelector models.EntitySelector,
	relation models.Relation,
	rightSelector models.EntitySelector,
) (models.LogicClue, error) {
	if relation != models.RelationIs &&
		relation != models.RelationIsNot {
		return models.LogicClue{}, fmt.Errorf(
			"unsupported relation %q",
			relation,
		)
	}

	left, err :=
		resolveSelector(
			puzzle,
			leftSelector,
		)

	if err != nil {
		return models.LogicClue{}, fmt.Errorf(
			"left selector: %w",
			err,
		)
	}

	right, err :=
		resolveSelector(
			puzzle,
			rightSelector,
		)

	if err != nil {
		return models.LogicClue{}, fmt.Errorf(
			"right selector: %w",
			err,
		)
	}

	return models.LogicClue{
		ID:       id,
		Type:     models.ClueTypePair,
		Left:     left,
		Right:    right,
		Relation: relation,
		Text:     text,
		Source: models.ClueSource{
			Type:    sourceType,
			Speaker: speaker,
		},
	}, nil
}

func resolveSelector(
	puzzle models.Puzzle,
	selector models.EntitySelector,
) (models.EntityRef, error) {
	values, details, err :=
		categoryData(
			puzzle,
			selector.Category,
		)

	if err != nil {
		return models.EntityRef{}, err
	}

	hasValue :=
		strings.TrimSpace(
			selector.Value,
		) != ""

	hasAttribute :=
		strings.TrimSpace(
			selector.Attribute,
		) != ""

	hasEquals :=
		selector.Equals.Kind != ""

	hasRank :=
		selector.Rank > 0

	modeCount := 0

	if hasValue {
		modeCount++
	}

	if hasAttribute &&
		hasEquals {
		modeCount++
	}

	if hasAttribute &&
		hasRank {
		modeCount++
	}

	if modeCount != 1 {
		return models.EntityRef{}, fmt.Errorf(
			"selector must use exactly one of value, attribute equals, or attribute rank",
		)
	}

	if hasValue {
		if !contains(
			values,
			selector.Value,
		) {
			return models.EntityRef{}, fmt.Errorf(
				"%q does not exist in category %q",
				selector.Value,
				selector.Category,
			)
		}

		return models.EntityRef{
			Category: selector.Category,
			Value:    selector.Value,
		}, nil
	}

	if hasEquals {
		matches := make(
			[]string,
			0,
			1,
		)

		for _, value := range values {
			attribute, exists :=
				details[value].Attributes[selector.Attribute]

			if !exists {
				continue
			}

			if attributeValuesEqual(
				attribute,
				selector.Equals,
			) {
				matches = append(
					matches,
					value,
				)
			}
		}

		if len(matches) != 1 {
			return models.EntityRef{}, fmt.Errorf(
				"attribute selector matched %d entities instead of 1",
				len(matches),
			)
		}

		return models.EntityRef{
			Category: selector.Category,
			Value:    matches[0],
		}, nil
	}

	if selector.Order != "ascending" &&
		selector.Order != "descending" {
		return models.EntityRef{}, fmt.Errorf(
			"rank selector order must be ascending or descending",
		)
	}

	type rankedValue struct {
		name   string
		number float64
	}

	ranked := make(
		[]rankedValue,
		0,
		len(values),
	)

	for _, value := range values {
		attribute, exists :=
			details[value].Attributes[selector.Attribute]

		if !exists {
			return models.EntityRef{}, fmt.Errorf(
				"%q has no %q attribute",
				value,
				selector.Attribute,
			)
		}

		if attribute.Kind !=
			models.AttributeNumber {
			return models.EntityRef{}, fmt.Errorf(
				"rank selector attribute %q must be numeric",
				selector.Attribute,
			)
		}

		ranked = append(
			ranked,
			rankedValue{
				name:   value,
				number: attribute.Number,
			},
		)
	}

	sort.SliceStable(
		ranked,
		func(first int, second int) bool {
			if selector.Order ==
				"descending" {
				return ranked[first].number >
					ranked[second].number
			}

			return ranked[first].number <
				ranked[second].number
		},
	)

	if selector.Rank >
		len(ranked) {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d exceeds category size %d",
			selector.Rank,
			len(ranked),
		)
	}

	targetIndex :=
		selector.Rank - 1

	target :=
		ranked[targetIndex]

	if targetIndex > 0 &&
		ranked[targetIndex-1].number ==
			target.number {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d is tied and therefore ambiguous",
			selector.Rank,
		)
	}

	if targetIndex+1 < len(ranked) &&
		ranked[targetIndex+1].number ==
			target.number {
		return models.EntityRef{}, fmt.Errorf(
			"rank %d is tied and therefore ambiguous",
			selector.Rank,
		)
	}

	return models.EntityRef{
		Category: selector.Category,
		Value:    target.name,
	}, nil
}

func categoryData(
	puzzle models.Puzzle,
	category models.Category,
) ([]string, map[string]models.EntityDetails, error) {
	switch category {
	case models.CategorySuspect:
		return puzzle.Suspects,
			puzzle.SuspectDetails,
			nil

	case models.CategoryWeapon:
		return puzzle.Weapons,
			puzzle.WeaponDetails,
			nil

	case models.CategoryLocation:
		return puzzle.Locations,
			puzzle.LocationDetails,
			nil

	case models.CategoryMotive:
		if len(puzzle.Motives) == 0 {
			return nil, nil, fmt.Errorf(
				"the case has no motive category",
			)
		}

		return puzzle.Motives,
			puzzle.MotiveDetails,
			nil

	default:
		return nil, nil, fmt.Errorf(
			"unsupported category %q",
			category,
		)
	}
}

func validatePuzzleStructure(
	puzzle models.Puzzle,
) error {
	size :=
		len(puzzle.Suspects)

	if puzzle.ID <= 0 {
		return fmt.Errorf(
			"case id must be a positive integer",
		)
	}

	if size < 3 || size > 5 {
		return fmt.Errorf(
			"suspect count must be between 3 and 5",
		)
	}

	if len(puzzle.Weapons) != size {
		return fmt.Errorf(
			"weapons count must match suspects count",
		)
	}

	if len(puzzle.Locations) != size {
		return fmt.Errorf(
			"locations count must match suspects count",
		)
	}

	if len(puzzle.Motives) > 0 &&
		len(puzzle.Motives) != size {
		return fmt.Errorf(
			"motives count must match suspects count",
		)
	}

	for label, values := range map[string][]string{
		"suspects":  puzzle.Suspects,
		"weapons":   puzzle.Weapons,
		"locations": puzzle.Locations,
		"motives":   puzzle.Motives,
	} {
		if err :=
			validateUnique(
				label,
				values,
			); err != nil {
			return err
		}
	}

	for index, interview := range puzzle.Interviews {
		if !contains(
			puzzle.Suspects,
			interview.Speaker,
		) {
			return fmt.Errorf(
				"interview %d has unknown speaker %q",
				index,
				interview.Speaker,
			)
		}
	}

	if !contains(
		puzzle.Suspects,
		puzzle.Solution.Suspect,
	) {
		return fmt.Errorf(
			"solution suspect %q is not in suspects",
			puzzle.Solution.Suspect,
		)
	}

	if !contains(
		puzzle.Weapons,
		puzzle.Solution.Weapon,
	) {
		return fmt.Errorf(
			"solution weapon %q is not in weapons",
			puzzle.Solution.Weapon,
		)
	}

	if !contains(
		puzzle.Locations,
		puzzle.Solution.Location,
	) {
		return fmt.Errorf(
			"solution location %q is not in locations",
			puzzle.Solution.Location,
		)
	}

	if len(puzzle.Motives) == 0 {
		if puzzle.Solution.Motive != "" {
			return fmt.Errorf(
				"solution motive must be empty when motives are disabled",
			)
		}
	} else if !contains(
		puzzle.Motives,
		puzzle.Solution.Motive,
	) {
		return fmt.Errorf(
			"solution motive %q is not in motives",
			puzzle.Solution.Motive,
		)
	}

	return nil
}

func validateUnique(
	label string,
	values []string,
) error {
	seen := make(
		map[string]struct{},
		len(values),
	)

	for _, value := range values {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf(
				"%s cannot contain empty values",
				label,
			)
		}

		if _, exists :=
			seen[value]; exists {
			return fmt.Errorf(
				"%s contains duplicate value %q",
				label,
				value,
			)
		}

		seen[value] =
			struct{}{}
	}

	return nil
}

func attributeValuesEqual(
	first models.AttributeValue,
	second models.AttributeValue,
) bool {
	if first.Kind !=
		second.Kind {
		return false
	}

	switch first.Kind {
	case models.AttributeString:
		return first.String ==
			second.String

	case models.AttributeNumber:
		return first.Number ==
			second.Number

	case models.AttributeBool:
		return first.Bool ==
			second.Bool

	default:
		return false
	}
}

func matchesSolution(
	intended models.Solution,
	candidate CandidateSolution,
) bool {
	return intended.Suspect ==
		candidate.Culprit &&
		intended.Weapon ==
			candidate.Weapon &&
		intended.Location ==
			candidate.Location &&
		intended.Motive ==
			candidate.Motive
}

func missingIndexes(
	length int,
	used map[int]struct{},
) []int {
	result := make(
		[]int,
		0,
		length-len(used),
	)

	for index := 0; index < length; index++ {
		if _, exists :=
			used[index]; !exists {
			result = append(
				result,
				index,
			)
		}
	}

	return result
}

func contains(
	values []string,
	target string,
) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}

func cloneStringMap(
	source map[string]string,
) map[string]string {
	if source == nil {
		return nil
	}

	result := make(
		map[string]string,
		len(source),
	)

	for key, value := range source {
		result[key] =
			value
	}

	return result
}

func cloneDetails(
	source map[string]models.EntityDetails,
) map[string]models.EntityDetails {
	if source == nil {
		return nil
	}

	result := make(
		map[string]models.EntityDetails,
		len(source),
	)

	for name, details := range source {
		cloned :=
			models.EntityDetails{}

		if details.Attributes != nil {
			cloned.Attributes =
				make(
					map[string]models.AttributeValue,
					len(details.Attributes),
				)

			for key, value := range details.Attributes {
				cloned.Attributes[key] =
					value
			}
		}

		result[name] =
			cloned
	}

	return result
}

func cloneAssignments(
	source map[string]models.Assignment,
) map[string]models.Assignment {
	result := make(
		map[string]models.Assignment,
		len(source),
	)

	for suspect, assignment := range source {
		result[suspect] =
			assignment
	}

	return result
}
