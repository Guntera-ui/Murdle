function renderList(items, elementId) {

    const list = document.getElementById(elementId);

    items.forEach(item => {

        const li = document.createElement("li");

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

function renderGrid(grid) {

    const container =
        document.getElementById("grid-container");

    const table =
        document.createElement("table");

    const headerRow =
        document.createElement("tr");

    const cornerCell =
        document.createElement("th");

    headerRow.appendChild(cornerCell);

    const columns =
        Object.keys(
            Object.values(grid)[0]
        );

    columns.forEach(column => {

        const th =
            document.createElement("th");

        th.textContent = column;

        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    Object.entries(grid).forEach(
        ([rowName, rowData]) => {

            const row =
                document.createElement("tr");

            const rowHeader =
                document.createElement("th");

            rowHeader.textContent =
                rowName;

            row.appendChild(rowHeader);

            Object.values(rowData)
                .forEach(value => {

                    const td =
                        document.createElement("td");

                    td.textContent =
                        value;

                    row.appendChild(td);
                });

            table.appendChild(row);
        }
    );

    container.appendChild(table);
}

fetch("/api/puzzle/tutorial")
    .then(response => response.json())
    .then(puzzle => {

        console.log("Puzzle:");
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

        const grid = createGrid(
            puzzle.weapons,
            puzzle.suspects
        );

        console.log("Grid:");
        console.log(grid);

        renderGrid(grid);

    })
    .catch(error => {
        console.error("Error loading puzzle:");
        console.error(error);
    });