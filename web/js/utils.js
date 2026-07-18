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

        if (puzzle[id]) {

            list.push({

                id,
                label,
                items: puzzle[id]

            });

        }

    };

    addCategory("suspects", "Suspects");
    addCategory("weapons", "Weapons");
    addCategory("motives", "Motives");
    addCategory("locations", "Locations");

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

function getMatrix(board, matrixId) {

    return board.matrices.find(
        matrix => matrix.id === matrixId
    );

}