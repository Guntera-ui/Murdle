package generator

import "murdle/internal/models"

func statementConsistent(
	assignments map[string]models.Assignment,
	culprit string,
	rules models.StatementRules,
	statement models.LogicStatement,
) bool {
	claimIsTrue := clueSatisfied(assignments, statement.Claim)

	if statement.Speaker == culprit && rules.CulpritLies {
		return !claimIsTrue
	}

	if statement.Speaker != culprit && rules.InnocentsTellTruth {
		return claimIsTrue
	}

	return true
}

func allStatementsConsistent(
	assignments map[string]models.Assignment,
	culprit string,
	rules models.StatementRules,
	statements []models.LogicStatement,
) bool {
	for _, statement := range statements {
		if !statementConsistent(
			assignments,
			culprit,
			rules,
			statement,
		) {
			return false
		}
	}

	return true
}
