package generator

func permutations(values []string) [][]string {
	result := make([][]string, 0)
	current := append([]string(nil), values...)

	var walk func(int)

	walk = func(index int) {
		if index == len(current) {
			result = append(result, append([]string(nil), current...))
			return
		}

		for position := index; position < len(current); position++ {
			current[index], current[position] = current[position], current[index]
			walk(index + 1)
			current[index], current[position] = current[position], current[index]
		}
	}

	walk(0)
	return result
}
