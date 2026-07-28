package generator

import (
	"fmt"
	"math/bits"

	"murdle/internal/models"
)

type MysterySolution struct {
	Culprit     string
	Assignments map[string]models.Assignment
}

type compiledRef struct {
	category models.Category
	index    int
}

type compiledClue struct {
	left     compiledRef
	right    compiledRef
	relation models.Relation
}

type compiledStatement struct {
	speaker int
	claim   compiledClue
}

type indexedConfig struct {
	size           int
	suspects       []string
	weapons        []string
	locations      []string
	motives        []string
	suspectIndex   map[string]int
	weaponIndex    map[string]int
	locationIndex  map[string]int
	motiveIndex    map[string]int
	permutations   [][]uint8
	inversePerms   [][]uint8
	hasMotives     bool
	statementRules models.StatementRules
}

func newIndexedConfig(config Config) indexedConfig {
	size := len(config.Suspects)
	perms := indexPermutations(size)
	inverse := make([][]uint8, len(perms))

	for index, permutation := range perms {
		inverse[index] = inversePermutation(permutation)
	}

	return indexedConfig{
		size:           size,
		suspects:       config.Suspects,
		weapons:        config.Weapons,
		locations:      config.Locations,
		motives:        config.Motives,
		suspectIndex:   makeIndex(config.Suspects),
		weaponIndex:    makeIndex(config.Weapons),
		locationIndex:  makeIndex(config.Locations),
		motiveIndex:    makeIndex(config.Motives),
		permutations:   perms,
		inversePerms:   inverse,
		hasMotives:     len(config.Motives) > 0,
		statementRules: config.StatementRules,
	}
}

func makeIndex(values []string) map[string]int {
	result := make(map[string]int, len(values))

	for index, value := range values {
		result[value] = index
	}

	return result
}

func indexPermutations(size int) [][]uint8 {
	values := make([]uint8, size)

	for index := range values {
		values[index] = uint8(index)
	}

	result := make([][]uint8, 0)

	var walk func(int)

	walk = func(index int) {
		if index == len(values) {
			result = append(result, append([]uint8(nil), values...))
			return
		}

		for position := index; position < len(values); position++ {
			values[index], values[position] = values[position], values[index]
			walk(index + 1)
			values[index], values[position] = values[position], values[index]
		}
	}

	walk(0)
	return result
}

func inversePermutation(permutation []uint8) []uint8 {
	inverse := make([]uint8, len(permutation))

	for owner, value := range permutation {
		inverse[value] = uint8(owner)
	}

	return inverse
}

func (indexed indexedConfig) compileRef(ref models.EntityRef) (compiledRef, error) {
	var (
		index  int
		exists bool
	)

	switch ref.Category {
	case models.CategorySuspect:
		index, exists = indexed.suspectIndex[ref.Value]
	case models.CategoryWeapon:
		index, exists = indexed.weaponIndex[ref.Value]
	case models.CategoryLocation:
		index, exists = indexed.locationIndex[ref.Value]
	case models.CategoryMotive:
		index, exists = indexed.motiveIndex[ref.Value]
	default:
		return compiledRef{}, fmt.Errorf("unsupported category %q", ref.Category)
	}

	if !exists {
		return compiledRef{}, fmt.Errorf(
			"unknown %s value %q",
			ref.Category,
			ref.Value,
		)
	}

	return compiledRef{
		category: ref.Category,
		index:    index,
	}, nil
}

func (indexed indexedConfig) compileClue(clue models.LogicClue) (compiledClue, error) {
	left, err := indexed.compileRef(clue.Left)
	if err != nil {
		return compiledClue{}, err
	}

	right, err := indexed.compileRef(clue.Right)
	if err != nil {
		return compiledClue{}, err
	}

	return compiledClue{
		left:     left,
		right:    right,
		relation: clue.Relation,
	}, nil
}

func (indexed indexedConfig) compileClues(
	clues []models.LogicClue,
) ([]compiledClue, error) {
	result := make([]compiledClue, 0, len(clues))

	for _, clue := range clues {
		compiled, err := indexed.compileClue(clue)
		if err != nil {
			return nil, err
		}

		result = append(result, compiled)
	}

	return result, nil
}

func (indexed indexedConfig) compileStatements(
	statements []models.LogicStatement,
) ([]compiledStatement, error) {
	result := make([]compiledStatement, 0, len(statements))

	for _, statement := range statements {
		speaker, exists := indexed.suspectIndex[statement.Speaker]
		if !exists {
			return nil, fmt.Errorf(
				"statement speaker %q is not a suspect",
				statement.Speaker,
			)
		}

		claim, err := indexed.compileClue(statement.Claim)
		if err != nil {
			return nil, err
		}

		result = append(result, compiledStatement{
			speaker: speaker,
			claim:   claim,
		})
	}

	return result, nil
}

func ownerIndex(
	ref compiledRef,
	weaponOwners []uint8,
	locationOwners []uint8,
	motiveOwners []uint8,
) int {
	switch ref.category {
	case models.CategorySuspect:
		return ref.index
	case models.CategoryWeapon:
		return int(weaponOwners[ref.index])
	case models.CategoryLocation:
		return int(locationOwners[ref.index])
	case models.CategoryMotive:
		return int(motiveOwners[ref.index])
	default:
		return -1
	}
}

func compiledClueSatisfied(
	clue compiledClue,
	weaponOwners []uint8,
	locationOwners []uint8,
	motiveOwners []uint8,
) bool {
	leftOwner := ownerIndex(
		clue.left,
		weaponOwners,
		locationOwners,
		motiveOwners,
	)

	rightOwner := ownerIndex(
		clue.right,
		weaponOwners,
		locationOwners,
		motiveOwners,
	)

	switch clue.relation {
	case models.RelationIs:
		return leftOwner == rightOwner
	case models.RelationIsNot:
		return leftOwner != rightOwner
	default:
		return false
	}
}

func culpritMaskForStatements(
	indexed indexedConfig,
	statements []compiledStatement,
	weaponOwners []uint8,
	locationOwners []uint8,
	motiveOwners []uint8,
) uint8 {
	var mask uint8

	for culprit := 0; culprit < indexed.size; culprit++ {
		consistent := true

		for _, statement := range statements {
			claimIsTrue := compiledClueSatisfied(
				statement.claim,
				weaponOwners,
				locationOwners,
				motiveOwners,
			)

			if statement.speaker == culprit &&
				indexed.statementRules.CulpritLies &&
				claimIsTrue {
				consistent = false
				break
			}

			if statement.speaker != culprit &&
				indexed.statementRules.InnocentsTellTruth &&
				!claimIsTrue {
				consistent = false
				break
			}
		}

		if consistent {
			mask |= 1 << culprit
		}
	}

	return mask
}

func countMysterySolutionsOnly(
	config Config,
	clues []models.LogicClue,
	statements []models.LogicStatement,
	limit int,
) (int, error) {
	indexed := newIndexedConfig(config)
	compiledClues, err := indexed.compileClues(clues)
	if err != nil {
		return 0, err
	}

	compiledStatements, err := indexed.compileStatements(statements)
	if err != nil {
		return 0, err
	}

	count := 0
	motivePermCount := len(indexed.permutations)

	if !indexed.hasMotives {
		motivePermCount = 1
	}

	for weaponPermIndex := range indexed.permutations {
		weaponOwners := indexed.inversePerms[weaponPermIndex]

		for locationPermIndex := range indexed.permutations {
			locationOwners := indexed.inversePerms[locationPermIndex]

			for motivePermIndex := 0; motivePermIndex < motivePermCount; motivePermIndex++ {
				var motiveOwners []uint8

				if indexed.hasMotives {
					motiveOwners = indexed.inversePerms[motivePermIndex]
				}

				valid := true

				for _, clue := range compiledClues {
					if !compiledClueSatisfied(
						clue,
						weaponOwners,
						locationOwners,
						motiveOwners,
					) {
						valid = false
						break
					}
				}

				if !valid {
					continue
				}

				mask := culpritMaskForStatements(
					indexed,
					compiledStatements,
					weaponOwners,
					locationOwners,
					motiveOwners,
				)

				count += bits.OnesCount8(mask)

				if limit > 0 && count >= limit {
					return limit, nil
				}
			}
		}
	}

	return count, nil
}

func CountMysterySolutions(
	config Config,
	clues []models.LogicClue,
	statements []models.LogicStatement,
	limit int,
) (int, []MysterySolution) {
	count, err := countMysterySolutionsOnly(
		config,
		clues,
		statements,
		limit,
	)

	if err != nil {
		return 0, nil
	}

	if count == 0 {
		return 0, nil
	}

	collectionLimit := limit
	if collectionLimit <= 0 {
		collectionLimit = count
	}

	return count, collectMysterySolutions(
		config,
		clues,
		statements,
		collectionLimit,
	)
}

func collectMysterySolutions(
	config Config,
	clues []models.LogicClue,
	statements []models.LogicStatement,
	limit int,
) []MysterySolution {
	weaponPermutations := permutations(config.Weapons)
	locationPermutations := permutations(config.Locations)
	motivePermutations := [][]string{nil}

	if len(config.Motives) > 0 {
		motivePermutations = permutations(config.Motives)
	}

	result := make([]MysterySolution, 0, limit)

	for _, weapons := range weaponPermutations {
		for _, locations := range locationPermutations {
			for _, motives := range motivePermutations {
				assignments := buildAssignmentsFromPermutations(
					config,
					weapons,
					locations,
					motives,
				)

				if !allCluesSatisfied(assignments, clues) {
					continue
				}

				for _, culprit := range config.Suspects {
					if !allStatementsConsistent(
						assignments,
						culprit,
						config.StatementRules,
						statements,
					) {
						continue
					}

					result = append(result, MysterySolution{
						Culprit:     culprit,
						Assignments: assignments,
					})

					if len(result) >= limit {
						return result
					}
				}
			}
		}
	}

	return result
}
