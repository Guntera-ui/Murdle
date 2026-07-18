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