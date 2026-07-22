function showEndScreen(
    title,
    message,
    details,
    buttonText
) {

    document
        .getElementById(
            "end-title"
        ).textContent =
        title;

    document
        .getElementById(
            "end-message"
        ).textContent =
        message;

    document
        .getElementById(
            "end-details"
        ).innerHTML =
        details;

    document
        .getElementById(
            "end-button"
        ).textContent =
        buttonText;

    document
        .getElementById(
            "end-screen"
        ).classList.remove(
            "hidden"
        );

}

