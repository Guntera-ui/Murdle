function renderList(items, elementId) {

    const list =
        document.getElementById(elementId);

    list.innerHTML = "";

    items.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        list.appendChild(li);
    });
}

function createGrid(rows, columns) {

    const grid = {};

    rows.forEach(row => {

        grid[row] = {};

        columns.forEach(column => {

            grid[row][column] = "";

        });
    });

    return grid;
}

function getNextState(currentState) {

    if (currentState === "") {
        return "✓";
    }

    if (currentState === "✓") {
        return "✗";
    }

    return "";
}

function abbreviation(text) {

    const words = text.split(" ");

    if (words.length === 1) {
        return text.slice(0, 2).toUpperCase();
    }

    return words
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

function createCell(value) {

    const cell =
        document.createElement("div");

    cell.className =
        "grid-cell";

    cell.textContent =
        value;

    if (value === "✓") {
        cell.classList.add("cell-yes");
    }

    if (value === "✗") {
        cell.classList.add("cell-no");
    }

    return cell;
}

function renderMasterGrid(
    suspects,
    weapons,
    locations,
    weaponGrid,
    locationGrid,
    weaponLocationGrid
) {

    const container =
        document.getElementById("master-grid");

    container.innerHTML = "";

    const board =
        document.createElement("div");

    board.className =
        "master-board";

    const header =
        document.createElement("div");

    header.className =
        "board-row";

    const spacer =
        document.createElement("div");

    spacer.className =
        "header-spacer";

    header.appendChild(spacer);

    suspects.forEach(suspect => {

        const cell =
            document.createElement("div");

        cell.className =
            "header-cell";

        cell.textContent =
            abbreviation(suspect);

        header.appendChild(cell);
    });

    locations.forEach(location => {

        const cell =
            document.createElement("div");

        cell.className =
            "header-cell";

        cell.textContent =
            abbreviation(location);

        header.appendChild(cell);
    });

    board.appendChild(header);



    weapons.forEach(weapon => {

        const row =
            document.createElement("div");

        row.className =
            "board-row";

        const label =
            document.createElement("div");

        label.className =
            "row-label";

        label.textContent =
            abbreviation(weapon);

        row.appendChild(label);

        suspects.forEach(suspect => {

            const cell =
                createCell(
                    weaponGrid[weapon][suspect]
                );

            cell.addEventListener(
                "click",
                () => {

                    weaponGrid[weapon][suspect] =
                        getNextState(
                            weaponGrid[weapon][suspect]
                        );

                    renderMasterGrid(
                        suspects,
                        weapons,
                        locations,
                        weaponGrid,
                        locationGrid,
                        weaponLocationGrid
                    );
                }
            );

            row.appendChild(cell);
        });

        locations.forEach(location => {

            const cell =
                createCell(
                    weaponLocationGrid[weapon][location]
                );

            cell.addEventListener(
                "click",
                () => {

                    weaponLocationGrid[weapon][location] =
                        getNextState(
                            weaponLocationGrid[weapon][location]
                        );

                    renderMasterGrid(
                        suspects,
                        weapons,
                        locations,
                        weaponGrid,
                        locationGrid,
                        weaponLocationGrid
                    );
                }
            );

            row.appendChild(cell);
        });

        board.appendChild(row);
    });


    const divider =
        document.createElement("div");

    divider.className =
        "board-divider";

    board.appendChild(divider);


    locations.forEach(location => {

        const row =
            document.createElement("div");

        row.className =
            "location-row";

        const label =
            document.createElement("div");

        label.className =
            "row-label";

        label.textContent =
            abbreviation(location);

        row.appendChild(label);

        suspects.forEach(suspect => {

            const cell =
                createCell(
                    locationGrid[location][suspect]
                );

            cell.addEventListener(
                "click",
                () => {

                    locationGrid[location][suspect] =
                        getNextState(
                            locationGrid[location][suspect]
                        );

                    renderMasterGrid(
                        suspects,
                        weapons,
                        locations,
                        weaponGrid,
                        locationGrid,
                        weaponLocationGrid
                    );
                }
            );

            row.appendChild(cell);
        });

        board.appendChild(row);
    });

    container.appendChild(board);
}

fetch("/api/puzzle/tutorial")
    .then(response => response.json())
    .then(puzzle => {

        document.getElementById(
            "title"
        ).textContent =
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

        const weaponGrid =
            createGrid(
                puzzle.weapons,
                puzzle.suspects
            );

        const locationGrid =
            createGrid(
                puzzle.locations,
                puzzle.suspects
            );

        const weaponLocationGrid =
            createGrid(
                puzzle.weapons,
                puzzle.locations
            );

        renderMasterGrid(
            puzzle.suspects,
            puzzle.weapons,
            puzzle.locations,
            weaponGrid,
            locationGrid,
            weaponLocationGrid
        );

    })
    .catch(error => {

        console.error(error);

    });