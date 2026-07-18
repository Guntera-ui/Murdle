fetchPuzzle("test4")
    .then(puzzle => {

        document.getElementById(
            "title"
        ).textContent =
            puzzle.title;

        const categories =
            createCategories(
                puzzle
            ).list;

        renderCategories(
            categories
        );

        renderList(
            puzzle.clues,
            "clues"
        );

        const board =
            createBoard(
                puzzle
            );

        renderMasterGrid(
            puzzle,
            board
        );

    })
    .catch(console.error);