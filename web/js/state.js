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

    return {

        weaponGrid: createGrid(
            puzzle.weapons,
            puzzle.suspects
        ),

        locationGrid: createGrid(
            puzzle.locations,
            puzzle.suspects
        ),

        weaponLocationGrid: createGrid(
            puzzle.weapons,
            puzzle.locations
        )

    };

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

        weaponGrid:
            copyGrid(board.weaponGrid),

        locationGrid:
            copyGrid(board.locationGrid),

        weaponLocationGrid:
            copyGrid(board.weaponLocationGrid)

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

function setCell(board, matrixName, row, column, value) {

    board[matrixName][row][column] = value;

}

function crossOutRow(
    board,
    matrixName,
    row,
    selectedColumn
) {

    let changed = false;

    const grid =
        board[matrixName];

    Object.keys(grid[row]).forEach(column => {

        if (column === selectedColumn) {
            return;
        }

        if (grid[row][column] !== "") {
            return;
        }

        setCell(
            board,
            matrixName,
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
    matrixName,
    selectedRow,
    column
) {

    let changed = false;

    const grid =
        board[matrixName];

    Object.keys(grid).forEach(row => {

        if (row === selectedRow) {
            return;
        }

        if (grid[row][column] !== "") {
            return;
        }

        setCell(
            board,
            matrixName,
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

    const matrices = [

        "weaponGrid",
        "locationGrid",
        "weaponLocationGrid"

    ];

    matrices.forEach(matrixName => {

        const grid =
            board[matrixName];

        Object.keys(grid).forEach(row => {

            Object.keys(grid[row]).forEach(column => {

                if (grid[row][column] !== "✓") {
                    return;
                }

                changed =
                    crossOutRow(
                        board,
                        matrixName,
                        row,
                        column
                    ) || changed;

                changed =
                    crossOutColumn(
                        board,
                        matrixName,
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

    const matrices = [

        "weaponGrid",
        "locationGrid",
        "weaponLocationGrid"

    ];

    matrices.forEach(matrixName => {

        const grid = board[matrixName];

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
                    matrixName,
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

    const matrices = [

        "weaponGrid",
        "locationGrid",
        "weaponLocationGrid"

    ];

    matrices.forEach(matrixName => {

        const grid = board[matrixName];

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
                    matrixName,
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
    matrixName,
    row,
    column
) {

    setCell(
        board,
        matrixName,
        row,
        column,
        "✓"
    );

}

function markNo(
    board,
    matrixName,
    row,
    column
) {

    setCell(
        board,
        matrixName,
        row,
        column,
        "✗"
    );

}

function clearCell(
    board,
    matrixName,
    row,
    column
) {

    setCell(
        board,
        matrixName,
        row,
        column,
        ""
    );

}

function markCell(
    board,
    matrixName,
    row,
    column
) {

    const currentValue =
        board[matrixName][row][column];

    if (currentValue === "") {

        markYes(
            board,
            matrixName,
            row,
            column
        );

        return;

    }

    if (currentValue === "✓") {

        markNo(
            board,
            matrixName,
            row,
            column
        );

        return;

    }

    clearCell(
        board,
        matrixName,
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