package generator

import (
	"math/bits"
	"runtime"
	"sync"

	"murdle/internal/models"
)

type compactMysteryCandidate struct {
	weaponPermutation   uint8
	locationPermutation uint8
	motivePermutation   uint8
	culpritMask         uint8
}

type mysterySpace struct {
	indexed    indexedConfig
	candidates []compactMysteryCandidate
}

func buildMysterySpace(
	config Config,
	statements []models.LogicStatement,
) (*mysterySpace, error) {
	indexed := newIndexedConfig(config)
	compiledStatements, err := indexed.compileStatements(statements)
	if err != nil {
		return nil, err
	}

	motivePermCount := len(indexed.permutations)
	if !indexed.hasMotives {
		motivePermCount = 1
	}

	capacity := len(indexed.permutations) *
		len(indexed.permutations) *
		motivePermCount

	candidates := make([]compactMysteryCandidate, 0, capacity/4)

	for weaponPermIndex := range indexed.permutations {
		weaponOwners := indexed.inversePerms[weaponPermIndex]

		for locationPermIndex := range indexed.permutations {
			locationOwners := indexed.inversePerms[locationPermIndex]

			for motivePermIndex := 0; motivePermIndex < motivePermCount; motivePermIndex++ {
				var motiveOwners []uint8
				if indexed.hasMotives {
					motiveOwners = indexed.inversePerms[motivePermIndex]
				}

				mask := culpritMaskForStatements(
					indexed,
					compiledStatements,
					weaponOwners,
					locationOwners,
					motiveOwners,
				)

				if mask == 0 {
					continue
				}

				candidates = append(candidates, compactMysteryCandidate{
					weaponPermutation:   uint8(weaponPermIndex),
					locationPermutation: uint8(locationPermIndex),
					motivePermutation:   uint8(motivePermIndex),
					culpritMask:         mask,
				})
			}
		}
	}

	return &mysterySpace{
		indexed:    indexed,
		candidates: candidates,
	}, nil
}

func (space *mysterySpace) solutionCount(
	candidates []compactMysteryCandidate,
	limit int,
) int {
	count := 0

	for _, candidate := range candidates {
		count += bits.OnesCount8(candidate.culpritMask)
		if limit > 0 && count >= limit {
			return limit
		}
	}

	return count
}

func (space *mysterySpace) clueSatisfied(
	candidate compactMysteryCandidate,
	clue compiledClue,
) bool {
	weaponOwners := space.indexed.inversePerms[candidate.weaponPermutation]
	locationOwners := space.indexed.inversePerms[candidate.locationPermutation]

	var motiveOwners []uint8
	if space.indexed.hasMotives {
		motiveOwners = space.indexed.inversePerms[candidate.motivePermutation]
	}

	return compiledClueSatisfied(
		clue,
		weaponOwners,
		locationOwners,
		motiveOwners,
	)
}

func (space *mysterySpace) filterByClue(
	candidates []compactMysteryCandidate,
	clue compiledClue,
) []compactMysteryCandidate {
	result := make([]compactMysteryCandidate, 0, len(candidates))

	for _, candidate := range candidates {
		if space.clueSatisfied(candidate, clue) {
			result = append(result, candidate)
		}
	}

	return result
}

func (space *mysterySpace) candidateCounts(
	active []compactMysteryCandidate,
	clues []models.LogicClue,
	limit int,
) ([]int, error) {
	compiled := make([]compiledClue, len(clues))

	for index, clue := range clues {
		compiledClue, err := space.indexed.compileClue(clue)
		if err != nil {
			return nil, err
		}
		compiled[index] = compiledClue
	}

	counts := make([]int, len(clues))
	jobs := make(chan int)
	workers := runtime.GOMAXPROCS(0)

	if workers > len(clues) {
		workers = len(clues)
	}

	if workers < 1 {
		workers = 1
	}

	var wait sync.WaitGroup
	wait.Add(workers)

	for worker := 0; worker < workers; worker++ {
		go func() {
			defer wait.Done()

			for clueIndex := range jobs {
				count := 0
				clue := compiled[clueIndex]

				for _, candidate := range active {
					if !space.clueSatisfied(candidate, clue) {
						continue
					}

					count += bits.OnesCount8(candidate.culpritMask)
					if limit > 0 && count >= limit {
						count = limit
						break
					}
				}

				counts[clueIndex] = count
			}
		}()
	}

	for index := range clues {
		jobs <- index
	}
	close(jobs)
	wait.Wait()

	return counts, nil
}
