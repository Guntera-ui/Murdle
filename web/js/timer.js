let caseTimerStartedAt =
    null;

let finalCaseSolveTime =
    null;


function startCaseTimer() {

    caseTimerStartedAt =
        performance.now();

    finalCaseSolveTime =
        null;

}


function stopCaseTimer() {

    /*
        Return the already-frozen result if something calls
        this function more than once.
    */
    if (finalCaseSolveTime !== null) {

        return finalCaseSolveTime;

    }


    if (caseTimerStartedAt === null) {

        finalCaseSolveTime =
            "00:00";

        return finalCaseSolveTime;

    }


    const elapsedMilliseconds =
        performance.now() -
        caseTimerStartedAt;


    finalCaseSolveTime =
        formatSolveTime(
            elapsedMilliseconds
        );


    caseTimerStartedAt =
        null;


    return finalCaseSolveTime;

}


function formatSolveTime(
    milliseconds
) {

    const totalSeconds =
        Math.floor(
            milliseconds / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );

    const seconds =
        totalSeconds % 60;


    const formattedMinutes =
        String(minutes)
            .padStart(
                2,
                "0"
            );

    const formattedSeconds =
        String(seconds)
            .padStart(
                2,
                "0"
            );


    if (hours > 0) {

        return [
            String(hours)
                .padStart(
                    2,
                    "0"
                ),

            formattedMinutes,

            formattedSeconds
        ].join(":");

    }


    return [
        formattedMinutes,
        formattedSeconds
    ].join(":");

}