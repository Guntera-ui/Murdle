function showEndScreen(
    {
        title,
        message,
        details,
        buttonText,
        onButtonClick
    }
) {

    document.getElementById(
        "end-title"
    ).textContent =
        title;

    document.getElementById(
        "end-message"
    ).textContent =
        message;

    document.getElementById(
        "end-details"
    ).innerHTML =
        details;

    const button =
        document.getElementById(
            "end-button"
        );

    button.textContent =
        buttonText;

    button.onclick = () => {

        document
            .getElementById(
                "end-screen"
            )
            .classList.add(
                "hidden"
            );

        if (onButtonClick) {

            onButtonClick();

        }

    };

    document
        .getElementById(
            "end-screen"
        )
        .classList.remove(
            "hidden"
        );

}