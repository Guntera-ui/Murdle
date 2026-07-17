function updateBoard(
    puzzle,
    board,
    matrixName,
    row,
    column
) {

    markCell(
        board,
        matrixName,
        row,
        column
    );

    renderMasterGrid(
        puzzle,
        getWorkingBoard(board)
    );

}

function renderMasterGrid(
    puzzle,
    board
) {

    const container =
        document.getElementById(
            "master-grid"
        );

    container.innerHTML = "";



    const boardElement =
        document.createElement("div");

    boardElement.className =
        "master-board";



    const weaponSuspectMatrix =
        renderMatrix(
            puzzle.weapons,
            puzzle.suspects,
            board.weaponGrid,
            (weapon, suspect) => {

                updateBoard(
                    puzzle,
                    board,
                    "weaponGrid",
                    weapon,
                    suspect
                );

            },
            true,
            true
        );



    const weaponLocationMatrix =
        renderMatrix(
            puzzle.weapons,
            puzzle.locations,
            board.weaponLocationGrid,
            (weapon, location) => {

                updateBoard(
                    puzzle,
                    board,
                    "weaponLocationGrid",
                    weapon,
                    location
                );

            },
            true,
            false
        );



    const locationSuspectMatrix =
        renderMatrix(
            puzzle.locations,
            puzzle.suspects,
            board.locationGrid,
            (location, suspect) => {

                updateBoard(
                    puzzle,
                    board,
                    "locationGrid",
                    location,
                    suspect
                );

            },
            false,
            true
        );



    const topRow =
        document.createElement("div");

    topRow.className =
        "board-top";

    topRow.appendChild(
        weaponSuspectMatrix
    );

    topRow.appendChild(
        weaponLocationMatrix
    );



    const bottomRow =
        document.createElement("div");

    bottomRow.className =
        "board-bottom";

    bottomRow.appendChild(
        locationSuspectMatrix
    );



    boardElement.appendChild(
        topRow
    );

    boardElement.appendChild(
        bottomRow
    );



    container.appendChild(
        boardElement
    );

}