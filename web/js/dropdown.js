function createDropdown(
    label,
    items
) {

    let selectedValue = null;

    const dropdown =
        document.createElement(
            "div"
        );

    dropdown.className =
        "dropdown";

    const button =
        document.createElement(
            "button"
        );

    button.className =
        "dropdown-button";

    button.type =
        "button";

    button.innerHTML =
        `
        <span class="dropdown-text">
            ${label}
        </span>

        <span class="dropdown-arrow">
            ▼
        </span>
        `;

    const menu =
        document.createElement(
            "div"
        );

    menu.className =
        "dropdown-menu";

    items.forEach(item => {

        const option =
            document.createElement(
                "button"
            );

        option.type =
            "button";

        option.className =
            "dropdown-item";

        option.textContent =
            item;

        option.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                selectedValue =
                    item;

                button.querySelector(
                    ".dropdown-text"
                ).textContent =
                    item;

                menu.classList.remove(
                    "open"
                );

                button.classList.remove(
                    "open"
                );

            }
        );

        menu.appendChild(
            option
        );

    });

    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            const isOpen =
                menu.classList.contains(
                    "open"
                );

            document
                .querySelectorAll(
                    ".dropdown-menu.open"
                )
                .forEach(openMenu => {

                    openMenu.classList.remove(
                        "open"
                    );

                });

            document
                .querySelectorAll(
                    ".dropdown-button.open"
                )
                .forEach(openButton => {

                    openButton.classList.remove(
                        "open"
                    );

                });

            if (!isOpen) {

                menu.classList.add(
                    "open"
                );

                button.classList.add(
                    "open"
                );

            }

        }
    );

    menu.addEventListener(
        "click",
        event => {

            event.stopPropagation();

        }
    );

    document.addEventListener(
        "click",
        () => {

            menu.classList.remove(
                "open"
            );

            button.classList.remove(
                "open"
            );

        }
    );

    dropdown.appendChild(
        button
    );

    dropdown.appendChild(
        menu
    );

    return {

        element: dropdown,

        getValue() {

            return selectedValue;

        }

    };

}