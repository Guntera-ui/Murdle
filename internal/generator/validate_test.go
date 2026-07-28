package generator

import "testing"

func validConfig() Config {
	return Config{
		Seed:       1001,
		CaseNumber: "001",
		Title:      "THE ENAGETI INCIDENT",
		Difficulty: "Easy",
		Suspects:   []string{"Marki", "Bego", "Baxi"},
		Weapons:    []string{"Crowbar", "Rock", "Brick"},
		Locations:  []string{"Warehouse", "Garden", "House"},
		Motives:    []string{"Greed", "Revenge", "Jealousy"},
		Culprit:    "Bego",
	}
}

func TestValidateConfigAcceptsValidConfig(t *testing.T) {
	if err := ValidateConfig(validConfig()); err != nil {
		t.Fatalf("expected valid config, got %v", err)
	}
}

func TestValidateConfigRejectsMismatchedCategorySizes(t *testing.T) {
	config := validConfig()
	config.Weapons = []string{"Crowbar", "Rock"}

	if err := ValidateConfig(config); err == nil {
		t.Fatal("expected mismatched category sizes to fail")
	}
}

func TestValidateConfigRejectsUnknownCulprit(t *testing.T) {
	config := validConfig()
	config.Culprit = "Unknown"

	if err := ValidateConfig(config); err == nil {
		t.Fatal("expected unknown culprit to fail")
	}
}

func TestValidateConfigRejectsDuplicateValues(t *testing.T) {
	config := validConfig()
	config.Suspects = []string{"Marki", "Bego", "Bego"}

	if err := ValidateConfig(config); err == nil {
		t.Fatal("expected duplicate suspects to fail")
	}
}
