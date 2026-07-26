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
function createCell(
    playerValue,
    workingValue
) {

    const cell =
        document.createElement("div");

    cell.className =
        "grid-cell";

    cell.textContent =
        workingValue;

    if (workingValue === "✓") {
        cell.classList.add("cell-yes");
    }

    if (workingValue === "✗") {
        cell.classList.add("cell-no");
    }

    const isSolverMark =
        playerValue === "" &&
        workingValue !== "";

    if (isSolverMark) {
        cell.classList.add("cell-solver");
    } else if (workingValue !== "") {
        cell.classList.add("cell-player");
    }

    return {
        element: cell,
        isSolverMark
    };

}
function createCategories(puzzle) {

    const list = [];

    const addCategory = (id, label) => {

        if (!puzzle[id]) {
            return;
        }

        const items = puzzle[id].map((name, index) => {

            let icon;

            switch (id) {

                case "suspects":
                    icon = getIconPath(
                        "suspects",
                        puzzle.suspectIcons[name]
                    );
                    break;

                case "weapons":
                    icon = getIconPath(
                        "weapons",
                        Icons.weapons[name]
                    );
                    break;

                case "locations":
                    icon = getIconPath(
                        "locations",
                        Icons.locations[name]
                    );
                    break;

                case "motives":
                    icon = getIconPath(
                        "motives",
                        Icons.motives[name]
                    );
                    break;

            }

            return {
                name,
                icon
            };

        });

        list.push({
            id,
            label,
            items
        });

    };

    addCategory(
        "suspects",
        "Persons of Interest"
    );

    addCategory(
        "weapons",
        "Known Weapons"
    );

    addCategory(
        "motives",
        "Possible Motives"
    );

    addCategory(
        "locations",
        "Crime Scenes"
    );

    return {

        list,

        byId: Object.fromEntries(

            list.map(category => [

                category.id,
                category

            ])

        )

    };

}
function getMatrixByCategories(board, first, second) {

    return board.matrices.find(matrix =>

        (matrix.categoryA.id === first &&
         matrix.categoryB.id === second)

        ||

        (matrix.categoryA.id === second &&
         matrix.categoryB.id === first)

    );

}
function getMatrix(board, matrixId) {

    return board.matrices.find(
        matrix => matrix.id === matrixId
    );

}

function getCurrentCaseId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return Number(
        params.get("id") ?? 1
    );

}