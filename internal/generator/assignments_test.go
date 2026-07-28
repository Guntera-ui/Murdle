package generator

import (
	"math/rand"
	"reflect"
	"testing"
)

func TestGenerateAssignmentsUsesEveryValueOnce(t *testing.T) {
	config := validConfig()

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	assignments := GenerateAssignments(
		config,
		random,
	)

	if len(assignments) != len(config.Suspects) {
		t.Fatalf(
			"expected %d assignments, got %d",
			len(config.Suspects),
			len(assignments),
		)
	}

	weapons := make(map[string]bool)
	locations := make(map[string]bool)
	motives := make(map[string]bool)

	for _, assignment := range assignments {
		if weapons[assignment.Weapon] {
			t.Fatalf(
				"weapon %q was assigned more than once",
				assignment.Weapon,
			)
		}

		if locations[assignment.Location] {
			t.Fatalf(
				"location %q was assigned more than once",
				assignment.Location,
			)
		}

		if motives[assignment.Motive] {
			t.Fatalf(
				"motive %q was assigned more than once",
				assignment.Motive,
			)
		}

		weapons[assignment.Weapon] = true
		locations[assignment.Location] = true
		motives[assignment.Motive] = true
	}
}

func TestGenerateAssignmentsIsRepeatable(t *testing.T) {
	config := validConfig()

	firstRandom := rand.New(
		rand.NewSource(config.Seed),
	)

	secondRandom := rand.New(
		rand.NewSource(config.Seed),
	)

	first := GenerateAssignments(
		config,
		firstRandom,
	)

	second := GenerateAssignments(
		config,
		secondRandom,
	)

	if !reflect.DeepEqual(first, second) {
		t.Fatal(
			"same seed produced different assignments",
		)
	}
}

func TestGenerateAssignmentsDoesNotModifyConfigLists(t *testing.T) {
	config := validConfig()

	originalWeapons := append(
		[]string(nil),
		config.Weapons...,
	)

	random := rand.New(
		rand.NewSource(config.Seed),
	)

	GenerateAssignments(
		config,
		random,
	)

	if !reflect.DeepEqual(
		config.Weapons,
		originalWeapons,
	) {
		t.Fatal(
			"GenerateAssignments modified config.Weapons",
		)
	}
}
