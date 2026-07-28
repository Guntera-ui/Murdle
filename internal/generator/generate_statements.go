package generator

import (
	"fmt"
	"math/rand"

	"murdle/internal/models"
)

func GenerateStatements(
	config Config,
	assignments map[string]models.Assignment,
	random *rand.Rand,
) ([]models.LogicStatement, error) {
	if len(config.Suspects) == 5 {
		return generateRandomStatements(
			config,
			assignments,
			random,
		)
	}
	truthfulClaims := GenerateDirectCandidateClues(config, assignments)

	if len(truthfulClaims) < len(config.Suspects) {
		return nil, fmt.Errorf("not enough statement claims")
	}

	speakerOrder := append([]string(nil), config.Suspects...)
	random.Shuffle(len(speakerOrder), func(first int, second int) {
		speakerOrder[first], speakerOrder[second] =
			speakerOrder[second], speakerOrder[first]
	})

	selected := make([]models.LogicStatement, 0, len(config.Suspects))
	usedClaims := make(map[string]struct{})
	usedPairKinds := make(map[string]struct{})

	for _, speaker := range speakerOrder {
		candidates := statementCandidatesForSpeaker(
			config,
			truthfulClaims,
			speaker,
			usedClaims,
			random,
		)

		if len(candidates) == 0 {
			return nil, fmt.Errorf(
				"could not find a statement claim for %s",
				speaker,
			)
		}

		currentCount, err := countMysterySolutionsOnly(
			config,
			nil,
			selected,
			0,
		)
		if err != nil {
			return nil, err
		}

		bestCount := currentCount
		bestPairNovelty := -1
		bestIndexes := make([]int, 0)

		for index, candidate := range candidates {
			trial := append(
				append([]models.LogicStatement(nil), selected...),
				candidate,
			)

			count, err := countMysterySolutionsOnly(
				config,
				nil,
				trial,
				bestCount,
			)
			if err != nil {
				return nil, err
			}

			pairNovelty := 1
			if _, exists := usedPairKinds[statementPairKind(candidate.Claim)]; exists {
				pairNovelty = 0
			}

			if count < bestCount {
				bestCount = count
				bestPairNovelty = pairNovelty
				bestIndexes = []int{index}
				continue
			}

			if count == bestCount && pairNovelty > bestPairNovelty {
				bestPairNovelty = pairNovelty
				bestIndexes = []int{index}
				continue
			}

			if count == bestCount && pairNovelty == bestPairNovelty {
				bestIndexes = append(bestIndexes, index)
			}
		}

		if len(bestIndexes) == 0 {
			return nil, fmt.Errorf(
				"no statement by %s reduced the mystery space",
				speaker,
			)
		}

		chosen := candidates[bestIndexes[random.Intn(len(bestIndexes))]]
		usedClaims[statementClaimKey(chosen.Claim)] = struct{}{}
		usedPairKinds[statementPairKind(chosen.Claim)] = struct{}{}
		selected = append(selected, chosen)
	}

	ordered := make([]models.LogicStatement, 0, len(config.Suspects))
	bySpeaker := make(map[string]models.LogicStatement, len(selected))

	for _, statement := range selected {
		bySpeaker[statement.Speaker] = statement
	}

	for index, speaker := range config.Suspects {
		statement := bySpeaker[speaker]
		statement.ID = fmt.Sprintf("statement-%03d", index+1)
		statement.Claim.ID = fmt.Sprintf("statement-claim-%03d", index+1)
		ordered = append(ordered, statement)
	}

	return ordered, nil
}

func statementCandidatesForSpeaker(
	config Config,
	truthfulClaims []models.LogicClue,
	speaker string,
	usedClaims map[string]struct{},
	random *rand.Rand,
) []models.LogicStatement {
	claims := append([]models.LogicClue(nil), truthfulClaims...)
	random.Shuffle(len(claims), func(first int, second int) {
		claims[first], claims[second] = claims[second], claims[first]
	})

	const maximumCandidates = 36
	result := make([]models.LogicStatement, 0, maximumCandidates)

	for _, claim := range claims {
		if _, exists := usedClaims[statementClaimKey(claim)]; exists {
			continue
		}

		if claim.Left.Category == models.CategorySuspect &&
			claim.Left.Value == speaker &&
			claim.Right.Category == models.CategoryMotive {
			continue
		}

		if speaker == config.Culprit && config.StatementRules.CulpritLies {
			claim.Relation = invertRelation(claim.Relation)
		}

		claim.Source = models.ClueSource{
			Type:    "interview",
			Speaker: speaker,
		}
		claim.Text = formatStatementText(claim)

		result = append(result, models.LogicStatement{
			Speaker: speaker,
			Text:    claim.Text,
			Claim:   claim,
		})

		if len(result) >= maximumCandidates {
			break
		}
	}

	return result
}

func statementClaimKey(clue models.LogicClue) string {
	return fmt.Sprintf(
		"%s|%s|%s|%s|%s",
		clue.Left.Category,
		clue.Left.Value,
		clue.Right.Category,
		clue.Right.Value,
		clue.Relation,
	)
}

func statementPairKind(clue models.LogicClue) string {
	return fmt.Sprintf(
		"%s|%s",
		clue.Left.Category,
		clue.Right.Category,
	)
}

func generateRandomStatements(
	config Config,
	assignments map[string]models.Assignment,
	random *rand.Rand,
) ([]models.LogicStatement, error) {
	claims := GenerateDirectCandidateClues(config, assignments)
	random.Shuffle(len(claims), func(first int, second int) {
		claims[first], claims[second] = claims[second], claims[first]
	})

	usedClaims := make(map[string]struct{})
	usedPairs := make(map[string]struct{})
	result := make([]models.LogicStatement, 0, len(config.Suspects))

	for index, speaker := range config.Suspects {
		chosenIndex := -1

		for pass := 0; pass < 2 && chosenIndex == -1; pass++ {
			for claimIndex, claim := range claims {
				key := statementClaimKey(claim)
				if _, exists := usedClaims[key]; exists {
					continue
				}

				pair := statementPairKind(claim)
				if pass == 0 {
					if _, exists := usedPairs[pair]; exists {
						continue
					}
				}

				chosenIndex = claimIndex
				break
			}
		}

		if chosenIndex == -1 {
			return nil, fmt.Errorf(
				"could not find a random statement for %s",
				speaker,
			)
		}

		claim := claims[chosenIndex]
		usedClaims[statementClaimKey(claim)] = struct{}{}
		usedPairs[statementPairKind(claim)] = struct{}{}

		if speaker == config.Culprit && config.StatementRules.CulpritLies {
			claim.Relation = invertRelation(claim.Relation)
		}

		claim.ID = fmt.Sprintf("statement-claim-%03d", index+1)
		claim.Source = models.ClueSource{
			Type:    "interview",
			Speaker: speaker,
		}
		claim.Text = formatStatementText(claim)

		result = append(result, models.LogicStatement{
			ID:      fmt.Sprintf("statement-%03d", index+1),
			Speaker: speaker,
			Text:    claim.Text,
			Claim:   claim,
		})
	}

	return result, nil
}
