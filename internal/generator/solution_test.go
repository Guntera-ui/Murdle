package generator

import (
	"math/rand"
	"testing"
)

func TestBuildSolutionUsesCulpritAssignment(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	solution, err := BuildSolution(
		config.Culprit,
		assignments,
	)

	if err != nil {
		t.Fatalf(
			"expected solution to be built, got %v",
			err,
		)
	}

	culpritAssignment := assignments[config.Culprit]

	if solution.Suspect != config.Culprit {
		t.Fatalf(
			"expected suspect %q, got %q",
			config.Culprit,
			solution.Suspect,
		)
	}

	if solution.Weapon != culpritAssignment.Weapon {
		t.Fatalf(
			"expected weapon %q, got %q",
			culpritAssignment.Weapon,
			solution.Weapon,
		)
	}

	if solution.Location != culpritAssignment.Location {
		t.Fatalf(
			"expected location %q, got %q",
			culpritAssignment.Location,
			solution.Location,
		)
	}

	if solution.Motive != culpritAssignment.Motive {
		t.Fatalf(
			"expected motive %q, got %q",
			culpritAssignment.Motive,
			solution.Motive,
		)
	}
}

func TestBuildSolutionRejectsMissingCulprit(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	_, err := BuildSolution(
		"Unknown",
		assignments,
	)

	if err == nil {
		t.Fatal(
			"expected missing culprit to return an error",
		)
	}
}
