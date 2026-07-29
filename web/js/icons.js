const Icons = {

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
        "Trophy": "trophy",
        "Acer Aspire 5315": "laptop",
        "Energy Drink": "soda-can",
        "Calculus Homework": "spell-book",
        "Poisoned Coffee":"coffee-cup",
        "Communism":"death-note",
        "Paata's Fishing Rod":"fishing-pole",
    },

    locations: {
        "Gio's Room": "bed",
        "Library": "bookshelf",
        "Warehouse": "cargo-crate",
        "Clock Tower": "clock-tower",
        "Desk": "desk",
        "Factory": "factory",
        "House": "family-house",
        "Garden": "fruit-tree",
        "Garage": "mechanic-garage",
        "Observatory": "observatory",
        "Theater": "theater-curtains",
        "Dining Room": "wine-glass",
        "Bird Cage": "bird-cage",
        "Balcony": "wooden-fence",
        "Living Room": "sofa",
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