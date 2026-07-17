function renderList(items, elementId) {

    const list = document.getElementById(elementId);

    items.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    });
}

fetch("/api/puzzle/tutorial")
    .then(response => response.json())
    .then(puzzle => {

        console.log(puzzle);

        document.getElementById("title").textContent =
            puzzle.title;

        renderList(
            puzzle.suspects,
            "suspects"
        );

        renderList(
            puzzle.weapons,
            "weapons"
        );

        renderList(
            puzzle.locations,
            "locations"
        );

        renderList(
            puzzle.clues,
            "clues"
        );

    })
    .catch(error => {
        console.error(error);
    });