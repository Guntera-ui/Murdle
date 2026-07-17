fetch("/api/puzzle/tutorial")
    .then(response => response.json())
    .then(puzzle => {

        console.log(puzzle);

        document.getElementById("title").textContent =
            puzzle.title;

        const suspectsList =
            document.getElementById("suspects");

        puzzle.suspects.forEach(suspect => {

            const li =
                document.createElement("li");

            li.textContent = suspect;

            suspectsList.appendChild(li);
        });

        const weaponsList =
            document.getElementById("weapons");

        puzzle.weapons.forEach(weapon => {

            const li =
                document.createElement("li");

            li.textContent = weapon;

            weaponsList.appendChild(li);
        });

        const locationsList =
            document.getElementById("locations");

        puzzle.locations.forEach(location => {

            const li =
                document.createElement("li");

            li.textContent = location;

            locationsList.appendChild(li);
        });

    })
    .catch(error => {
        console.error(error);
    });