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

            const matrix =
                getMatrix(
                    board,
                    matrixId
                );

            const matrixElement =
                renderMatrix(

                    matrix,

                    (row, column) => {

                        updateBoard(
                            puzzle,
                            board,
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