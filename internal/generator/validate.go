package generator

import (
	"fmt"

	"murdle/internal/models"
)

func ValidateConfig(config Config) error {
	config = normalizeConfig(config)
	size := len(config.Suspects)

	if size < 3 || size > 5 {
		return fmt.Errorf("suspect count must be between 3 and 5")
	}

	if len(config.Weapons) != size {
		return fmt.Errorf("weapons count must match suspects count")
	}

	if len(config.Locations) != size {
		return fmt.Errorf("locations count must match suspects count")
	}

	if len(config.Motives) > 0 && len(config.Motives) != size {
		return fmt.Errorf("motives count must match suspects count")
	}

	if !contains(config.Suspects, config.Culprit) {
		return fmt.Errorf("culprit must exist in suspects")
	}

	if config.MinEvidenceClues < 1 {
		return fmt.Errorf("minEvidenceClues must be at least 1")
	}

	if config.MaxEvidenceClues < config.MinEvidenceClues {
		return fmt.Errorf("maxEvidenceClues cannot be smaller than minEvidenceClues")
	}

	if config.MaxEvidenceClues > 10 {
		return fmt.Errorf("maxEvidenceClues cannot exceed 10")
	}

	if config.MaxAttempts < 1 {
		return fmt.Errorf("maxAttempts must be at least 1")
	}

	for category, values := range map[string][]string{
		"suspects":  config.Suspects,
		"weapons":   config.Weapons,
		"locations": config.Locations,
		"motives":   config.Motives,
	} {
		if err := validateUnique(category, values); err != nil {
			return err
		}
	}

	if err := validateDetails(
		"suspectDetails",
		config.Suspects,
		config.SuspectDetails,
	); err != nil {
		return err
	}

	if err := validateDetails(
		"weaponDetails",
		config.Weapons,
		config.WeaponDetails,
	); err != nil {
		return err
	}

	if err := validateDetails(
		"locationDetails",
		config.Locations,
		config.LocationDetails,
	); err != nil {
		return err
	}

	if err := validateDetails(
		"motiveDetails",
		config.Motives,
		config.MotiveDetails,
	); err != nil {
		return err
	}

	return nil
}

func validateUnique(category string, values []string) error {
	seen := make(map[string]struct{}, len(values))

	for _, value := range values {
		if value == "" {
			return fmt.Errorf("%s cannot contain empty values", category)
		}

		if _, exists := seen[value]; exists {
			return fmt.Errorf("%s contains duplicate value %q", category, value)
		}

		seen[value] = struct{}{}
	}

	return nil
}

func validateDetails(
	label string,
	entities []string,
	details map[string]models.EntityDetails,
) error {
	for name, entity := range details {
		if !contains(entities, name) {
			return fmt.Errorf("%s contains unknown entity %q", label, name)
		}

		for attribute, value := range entity.Attributes {
			if attribute == "" {
				return fmt.Errorf("%s for %q contains an empty attribute name", label, name)
			}

			switch value.Kind {
			case models.AttributeString, models.AttributeNumber, models.AttributeBool:
			default:
				return fmt.Errorf(
					"attribute %q for %q has unsupported kind %q",
					attribute,
					name,
					value.Kind,
				)
			}
		}
	}

	return nil
}

func contains(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}
