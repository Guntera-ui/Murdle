const Icons = {

    suspects: [
        "alien-stare",
        "cat",
        "cleopatra",
        "doctor-face",
        "kenku-head",
        "liar",
        "mustache",
        "vampire-dracula",
        "witch-face",
        "wizard-face",
        "wolf-head",
        "woman-elf-face"
    ],

    weapons: {
        "Baseball Bat": "baseball-bat",
        "Bowie Knife": "bowie-knife",
        "Brick": "clay-brick",
        "Crossbow": "crossbow",
        "Crowbar": "crowbar",
        "Fire Axe": "fire-axe",
        "Lighter": "lighter",
        "Poison": "poison-bottle",
        "Revolver": "revolver",
        "Rock": "rock",
        "Scissors": "scissors",
        "Slipknot": "slipknot",
        "Syringe": "syringe",
        "Trophy": "trophy"
    },

    locations: {
        "Bedroom": "bed",
        "Library": "bookshelf",
        "Warehouse": "cargo-crate",
        "Clock Tower": "clock-tower",
        "Office": "desk",
        "Factory": "factory",
        "House": "family-house",
        "Garden": "fruit-tree",
        "Garage": "mechanic-garage",
        "Observatory": "observatory",
        "Theater": "theater-curtains",
        "Dining Room": "wine-glass"
    },

    motives: {
        "Chaos": "bad-gnome",
        "Bloodlust": "blood",
        "Jealousy": "broken-heart",
        "Revenge": "crossed-swords",
        "Power": "crown",
        "Curiosity": "eyeball",
        "Passion": "heart-beats",
        "Greed": "money-stack",
        "Knowledge": "philosopher-bust",
        "Inheritance": "scroll-quill",
        "Protection": "shield",
        "Hatred": "skull-slices"
    }

};

function getIconPath(category, icon) {
    return `assets/icons/${category}/${icon}.svg`;
}