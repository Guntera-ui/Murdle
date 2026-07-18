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

function createBoard(puzzle) {

    const categories = createCategories(puzzle);

    const board = {

        matrices: []

    };

    for (let i = 0; i < categories.list.length; i++) {

        for (let j = i + 1; j < categories.list.length; j++) {

            const categoryA = categories.list[i];
            const categoryB = categories.list[j];

            board.matrices.push({

                id: `${categoryA.id}|${categoryB.id}`,

                categoryA,

                categoryB,

                grid: createGrid(
                    categoryA.items,
                    categoryB.items
                )

            });

        }

    }

    return board;

}

function copyGrid(grid) {

    const copy = {};

    Object.keys(grid).forEach(row => {

        copy[row] = {};

        Object.keys(grid[row]).forEach(column => {

            copy[row][column] = grid[row][column];

        });

    });

    return copy;

}


function copyBoard(board) {

    return {

        matrices: board.matrices.map(matrix => ({

            id: matrix.id,

            categoryA: matrix.categoryA,

            categoryB: matrix.categoryB,

            grid: copyGrid(matrix.grid)

        }))

    };

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

function setCell(board, matrixId, row, column, value) {

    const matrix = getMatrix(
        board,
        matrixId
    );

    matrix.grid[row][column] = value;

}

function crossOutRow(
    board,
    matrixId,
    row,
    selectedColumn
) {

    let changed = false;

    const matrix = getMatrix(
        board,
        matrixId
    );

    const grid = matrix.grid;

    Object.keys(grid[row]).forEach(column => {

        if (column === selectedColumn) {
            return;
        }

        if (grid[row][column] !== "") {
            return;
        }

        setCell(
            board,
            matrixId,
            row,
            column,
            "✗"
        );

        changed = true;

    });

    return changed;

}
function crossOutColumn(
    board,
    matrixId,
    selectedRow,
    column
) {

    let changed = false;

    const matrix = getMatrix(
        board,
        matrixId
    );

    const grid = matrix.grid;

    Object.keys(grid).forEach(row => {

        if (row === selectedRow) {
            return;
        }

        if (grid[row][column] !== "") {
            return;
        }

        setCell(
            board,
            matrixId,
            row,
            column,
            "✗"
        );

        changed = true;

    });

    return changed;

}

function propagateCheckmarks(board) {

    let changed = false;

    board.matrices.forEach(matrix => {

        const grid = matrix.grid;

        Object.keys(grid).forEach(row => {

            Object.keys(grid[row]).forEach(column => {

                if (grid[row][column] !== "✓") {
                    return;
                }

                changed =
                    crossOutRow(
                        board,
                        matrix.id,
                        row,
                        column
                    ) || changed;

                changed =
                    crossOutColumn(
                        board,
                        matrix.id,
                        row,
                        column
                    ) || changed;

            });

        });

    });

    return changed;

}

function applySingleRemainingRows(board) {

    let changed = false;

    board.matrices.forEach(matrix => {

        const grid = matrix.grid;

        Object.keys(grid).forEach(row => {

            let blankCount = 0;
            let blankColumn = null;
            let hasCheckmark = false;

            Object.keys(grid[row]).forEach(column => {

                const value = grid[row][column];

                if (value === "✓") {

                    hasCheckmark = true;
                    return;

                }

                if (value === "") {

                    blankCount++;
                    blankColumn = column;

                }

            });

            if (!hasCheckmark && blankCount === 1) {

                markYes(
                    board,
                    matrix.id,
                    row,
                    blankColumn
                );

                changed = true;

            }

        });

    });

    return changed;

}

function applySingleRemainingColumns(board) {

    let changed = false;

    board.matrices.forEach(matrix => {

        const grid = matrix.grid;

        const rows = Object.keys(grid);
        const columns = Object.keys(grid[rows[0]]);

        columns.forEach(column => {

            let blankCount = 0;
            let blankRow = null;
            let hasCheckmark = false;

            rows.forEach(row => {

                const value = grid[row][column];

                if (value === "✓") {

                    hasCheckmark = true;
                    return;

                }

                if (value === "") {

                    blankCount++;
                    blankRow = row;

                }

            });

            if (!hasCheckmark && blankCount === 1) {

                markYes(
                    board,
                    matrix.id,
                    blankRow,
                    column
                );

                changed = true;

            }

        });

    });

    return changed;

}

function markYes(
    board,
    matrixId,
    row,
    column
) {

    setCell(
        board,
        matrixId,
        row,
        column,
        "✓"
    );

}

function markNo(
    board,
    matrixId,
    row,
    column
) {

    setCell(
        board,
        matrixId,
        row,
        column,
        "✗"
    );

}

function clearCell(
    board,
    matrixId,
    row,
    column
) {

    setCell(
        board,
        matrixId,
        row,
        column,
        ""
    );

}

function markCell(
    board,
    matrixId,
    row,
    column
) {

    const matrix = getMatrix(
        board,
        matrixId
    );

    const currentValue =
        matrix.grid[row][column];

    if (currentValue === "") {

        markYes(
            board,
            matrixId,
            row,
            column
        );

        return;

    }

    if (currentValue === "✓") {

        markNo(
            board,
            matrixId,
            row,
            column
        );

        return;

    }

    clearCell(
        board,
        matrixId,
        row,
        column
    );

}
function applyRules(board) {

    let changed;

    do {

        changed = false;

        changed =
            propagateCheckmarks(board) || changed;

        changed =
            applySingleRemainingRows(board) || changed;

        changed =
            applySingleRemainingColumns(board) || changed;

    } while (changed);

}

function getWorkingBoard(board) {

    const workingBoard =
        copyBoard(board);

    applyRules(
        workingBoard
    );

    return workingBoard;

}