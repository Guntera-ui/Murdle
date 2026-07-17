function fetchPuzzle(name) {

    return fetch(
        "/api/puzzle/" + name
    ).then(
        response => response.json()
    );
}