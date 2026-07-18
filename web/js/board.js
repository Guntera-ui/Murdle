function updateBoard(
    puzzle,
    playerBoard,
    matrixId,
    row,
    column
) {

    markCell(
        playerBoard,
        matrixId,
        row,
        column
    );

    renderMasterGrid(
        puzzle,
        playerBoard
    );

}

function renderMasterGrid(
    puzzle,
    playerBoard
) {

    const workingBoard =
        getWorkingBoard(
            playerBoard
        );

    const container =
        document.getElementById(
            "master-grid"
        );

    container.innerHTML = "";



    const boardElement =
        document.createElement("div");

    boardElement.className =
        "master-board";



    const categories =
        createCategories(
            puzzle
        ).list;



    for (
        let i = 0;
        i < categories.length - 1;
        i++
    ) {

        const boardRow =
            document.createElement("div");

        boardRow.className =
            "board-row";



        for (
            let j = i + 1;
            j < categories.length;
            j++
        ) {

            const matrixId =
                `${categories[i].id}|${categories[j].id}`;

            const playerMatrix =
    getMatrix(
        playerBoard,
        matrixId
    );

        const workingMatrix =
            getMatrix(
                workingBoard,
                matrixId
            );

        const matrixElement =
            renderMatrix(

                playerMatrix,
                workingMatrix,

                (row, column) => {

                    updateBoard(
                        puzzle,
                        playerBoard,
                        matrixId,
                        row,
                        column
                    );

                },

                i === 0,
                j === i + 1

            );
            boardRow.appendChild(
                matrixElement
            );

        }



        boardElement.appendChild(
            boardRow
        );

    }



    container.appendChild(
        boardElement
    );

}