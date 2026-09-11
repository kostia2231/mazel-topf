import type { RouteKey, Language } from "./config"

interface NavItem {
    route: RouteKey
    label: string
}

interface UiText {
    htmlLang: string
    navigation: NavItem[]
    secondaryNavigation: NavItem[]
    drawerNavigation: NavItem[]
    footerLinks: NavItem[]
    legalLinks: NavItem[]
    header: {
        mainNavigation: string
        navigation: string
        openMenu: string
        closeMenu: string
        toHome: string
        reservation: string
        switchLanguage: string
        extras: string
    }
    footer: {
        openingHours: string
        directions: string
        links: string
        newsletter: string
        emailPlaceholder: string
        emailLabel: string
        submit: string
    }
    banner: { home: string }
    menu: {
        title: string
        description: string
        lunchSpecial: string
        lunchHours: string
        vegetarian: string
        addOn: string
    }
    contact: {
        title: string
        description: string
        address: string
        openingHours: string
        name: string
        email: string
        message: string
        submit: string
        map: string
    }
    reviews: {
        previous: string
        next: string
        show: (position: number) => string
        stars: (count: number) => string
    }
    dishes: {
        viewOnMenu: (name: string) => string
        previous: string
        next: string
    }
    images: {
        hero: string
        dishesFromAbove: string
        facade: string
        challah: string
        tableWithBeer: string
        laidTable: string
        diningRoom: string
        signature: string
        chickenRisotto: string
        falafelPlate: string
        goatCheeseSalad: string
        pitaInPaper: string
        tableWithMatzo: string
        cateringBanner: string
        wineGlass: string
        cateringFormats: [string, string, string]
        falafelBowl: string
        mezzePlate: string
        fattoush: string
        shortRibs: string
        banner: (page: string) => string
        dish: (position: number) => string
        tiles: [string, string, string, string, string]
    }
    notFound: {
        title: string
        text: string
        cta: string
    }
    pageTitles: {
        home: string
        about: string
        aboutDescription: string
        catering: string
        cateringDescription: string
    }
}

export const ui: Record<Language, UiText> = {
    de: {
        htmlLang: "de",
        navigation: [
            { route: "home", label: "Startseite" },
            { route: "menu", label: "Speisekarte" },
            { route: "catering", label: "Catering" },
        ],
        secondaryNavigation: [
            { route: "contact", label: "Kontakt" },
            { route: "about", label: "Über Uns" },
            { route: "giftCard", label: "Gutschein" },
        ],
        drawerNavigation: [
            { route: "home", label: "Startseite" },
            { route: "menu", label: "Speisekarte" },
            { route: "about", label: "Über Uns" },
            { route: "catering", label: "Catering" },
            { route: "contact", label: "Kontakt" },
        ],
        footerLinks: [
            { route: "about", label: "Über Uns" },
            { route: "menu", label: "Speisekarte" },
            { route: "reservation", label: "Tisch reservieren" },
            { route: "feedback", label: "Feedback senden" },
        ],
        legalLinks: [
            { route: "cookies", label: "Cookies" },
            { route: "privacy", label: "Datenschutzhinweise" },
            { route: "imprint", label: "Impressum" },
        ],
        header: {
            mainNavigation: "Hauptnavigation",
            navigation: "Navigation",
            openMenu: "Menü öffnen",
            closeMenu: "Menü schließen",
            toHome: "Zur Startseite",
            reservation: "Reservation online",
            switchLanguage: "Sprache wechseln",
            extras: "Weitere Angebote",
        },
        footer: {
            openingHours: "Öffnungszeiten",
            directions: "So finden Sie uns",
            links: "Links",
            newsletter: "Aktuelles & Veranstaltungen",
            emailPlaceholder: "Email",
            emailLabel: "E-Mail-Adresse",
            submit: "Subscribe",
        },
        banner: { home: "Startseite" },
        menu: {
            title: "Speisekarte",
            description:
                "Unsere aktuelle Speise- und Getränkekarte – moderne israelische Küche in Berlin.",
            lunchSpecial: "Mittagsspecial",
            lunchHours: "Mo – Fr 12:00 – 16:00",
            vegetarian: "vegetarisch",
            addOn: "wahlweise mit",
        },
        contact: {
            title: "Kontakt",
            description:
                "Kontakt, Anfahrt und Öffnungszeiten von Masel Topf in Berlin.",
            address: "Adresse",
            openingHours: "Öffnungszeiten",
            name: "Name",
            email: "Email",
            message: "Your message",
            submit: "Send a message",
            map: "Karte: Rykestraße 2, 10405 Berlin",
        },
        reviews: {
            previous: "Vorherige Bewertung",
            next: "Nächste Bewertung",
            show: (position) => `Bewertung ${position} anzeigen`,
            stars: (count) => `${count} von 5 Sternen`,
        },
        dishes: {
            viewOnMenu: (name) => `${name} in der Speisekarte ansehen`,
            previous: "Voriges Gericht",
            next: "Nächstes Gericht",
        },
        images: {
            hero: "Koch würzt gegrilltes Fleisch in Gusseisenpfannen",
            dishesFromAbove: "Mezze und Vorspeisen von oben aufgenommen",
            facade: "Terrasse und Fassade des Restaurants in der Rykestraße",
            challah: "Frisch gebackene Challah mit Sesam auf einem Leinentuch",
            tableWithBeer: "Tisch mit Bier und Grillteller",
            laidTable: "Gedeckter Tisch im Restaurant",
            diningRoom: "Gastraum mit Kronleuchter, Kerzen und roten Bänken",
            signature:
                "Geschmorte Aubergine mit Rucola, Granatapfel und Tahina",
            chickenRisotto:
                "Gegrilltes Hähnchen auf Graupen mit Kräutersauce, daneben Auberginensalat",
            falafelPlate: "Falafel-Teller",
            goatCheeseSalad: "Ziegenkäse Salat",
            pitaInPaper: "Pita mit Hähnchen und Harissa, in Papier gewickelt",
            tableWithMatzo: "Gäste am gedeckten Tisch, Matze wird gebrochen",
            cateringBanner:
                "Dessert auf mit Beerensauce bemaltem Teller, daneben Matze und Spieße",
            wineGlass: "Glas Weißwein neben einer Vase mit Olivenzweigen",
            cateringFormats: [
                "Kellner deckt den Tisch für eine Veranstaltung ein",
                "Festlich eingedeckte Tafel unter Kronleuchtern im Zelt",
                "Wunderkerzen bei einer Feier am Abend",
            ],
            falafelBowl:
                "Falafel in einer Fladenbrotschale mit Hummus und Grillgemüse",
            mezzePlate:
                "Mezze-Teller mit Hummus, Baba Ghanoush, Schafskäse und gegrillter Aubergine",
            fattoush:
                "Fattusch mit Tomaten, Gurke, Minze und geröstetem Fladenbrot",
            shortRibs:
                "Geschmorte Kalbs-Short-Ribs in Rotweinsauce mit Topinambur-Chips",
            banner: (page) => `Bannerbild ${page}`,
            dish: (position) => `Gericht ${position}`,
            tiles: [
                "Gedeckter Tisch mit Saft, Zeitschrift und Grillspieß",
                "Pastrami Latkes mit gebeiztem Lachs",
                "Pita in Papier serviert",
                "Abend auf der Terrasse mit Dessert",
                "Mezze-Schale mit Grillgemüse bei Kerzenlicht",
            ],
        },
        notFound: {
            title: "Seite nicht gefunden",
            text: "Die Seite, die Sie suchen, gibt es nicht oder sie ist umgezogen.",
            cta: "Zur Startseite",
        },
        pageTitles: {
            home: "Israelisches Restaurant in Berlin",
            about: "Über Uns",
            aboutDescription:
                "Das Team von Masel Topf: Hände, die Traditionen in neue Geschmäcker verwandeln.",
            catering: "Catering",
            cateringDescription:
                "Catering von Masel Topf – vom privaten Abendessen bis zur Veranstaltung mit Hunderten von Gästen.",
        },
    },

    en: {
        htmlLang: "en",
        navigation: [
            { route: "home", label: "Home" },
            { route: "menu", label: "Menu" },
            { route: "about", label: "About Us" },
            { route: "catering", label: "Catering" },
            { route: "contact", label: "Contact" },
        ],
        secondaryNavigation: [
            { route: "privateDining", label: "Private Dining" },
            { route: "giftCard", label: "Gift Card" },
        ],
        drawerNavigation: [
            { route: "home", label: "Home" },
            { route: "menu", label: "Menu" },
            { route: "about", label: "About Us" },
            { route: "catering", label: "Catering" },
            { route: "contact", label: "Contact" },
        ],
        footerLinks: [
            { route: "about", label: "About Us" },
            { route: "menu", label: "Menu" },
            { route: "reservation", label: "Book a table" },
            { route: "feedback", label: "Send feedback" },
        ],
        legalLinks: [
            { route: "cookies", label: "Cookies" },
            { route: "privacy", label: "Privacy notice" },
            { route: "imprint", label: "Imprint" },
        ],
        header: {
            mainNavigation: "Main navigation",
            navigation: "Navigation",
            openMenu: "Open menu",
            closeMenu: "Close menu",
            toHome: "Go to homepage",
            reservation: "Reservation online",
            switchLanguage: "Change language",
            extras: "More offers",
        },
        footer: {
            openingHours: "Opening hours",
            directions: "How to find us",
            links: "Links",
            newsletter: "News & events",
            emailPlaceholder: "Email",
            emailLabel: "Email address",
            submit: "Subscribe",
        },
        banner: { home: "Home" },
        menu: {
            title: "Menu",
            description:
                "Our current food and drinks menu – modern Israeli cuisine in Berlin.",
            lunchSpecial: "Lunch special",
            lunchHours: "Mon–Fri 12:00 – 16:00",
            vegetarian: "vegetarian",
            addOn: "add on",
        },
        contact: {
            title: "Contact",
            description:
                "Contact details, directions and opening hours of Masel Topf in Berlin.",
            address: "Address",
            openingHours: "Opening hours",
            name: "Name",
            email: "Email",
            message: "Your message",
            submit: "Send a message",
            map: "Map: Rykestraße 2, 10405 Berlin",
        },
        reviews: {
            previous: "Previous review",
            next: "Next review",
            show: (position) => `Show review ${position}`,
            stars: (count) => `${count} out of 5 stars`,
        },
        dishes: {
            viewOnMenu: (name) => `View ${name} on the menu`,
            previous: "Previous dish",
            next: "Next dish",
        },
        images: {
            hero: "Chef seasoning grilled meat in cast-iron pans",
            dishesFromAbove: "Mezze and starters shot from above",
            facade: "Terrace and facade of the restaurant on Rykestraße",
            challah: "Freshly baked sesame challah on a linen cloth",
            tableWithBeer: "Table with beer and a grill platter",
            laidTable: "Laid table in the restaurant",
            diningRoom:
                "Dining room with chandelier, candles and red banquettes",
            signature: "Braised aubergine with rocket, pomegranate and tahina",
            chickenRisotto:
                "Grilled chicken on barley with herb sauce, aubergine salad alongside",
            falafelPlate: "Falafel plate",
            goatCheeseSalad: "Goat cheese salad",
            pitaInPaper: "Pita with chicken and harissa, wrapped in paper",
            tableWithMatzo: "Guests at the laid table, breaking matzo",
            cateringBanner:
                "Dessert on a plate painted with berry sauce, matzo and skewers alongside",
            wineGlass:
                "A glass of white wine beside a vase with olive branches",
            cateringFormats: [
                "A waiter setting the table for an event",
                "Festively laid table under chandeliers in a marquee",
                "Sparklers at an evening celebration",
            ],
            falafelBowl:
                "Falafel in a flatbread bowl with hummus and grilled vegetables",
            mezzePlate:
                "Mezze plate with hummus, baba ghanoush, feta and grilled aubergine",
            fattoush:
                "Fattoush with tomatoes, cucumber, mint and toasted flatbread",
            shortRibs:
                "Braised veal short ribs in red wine sauce with Jerusalem artichoke chips",
            banner: (page) => `Banner image ${page}`,
            dish: (position) => `Dish ${position}`,
            tiles: [
                "Laid table with juice, a magazine and a grilled skewer",
                "Pastrami latkes with cured salmon",
                "Pita served in paper",
                "An evening on the terrace with dessert",
                "Mezze bowl with grilled vegetables by candlelight",
            ],
        },
        notFound: {
            title: "Page not found",
            text: "The page you are looking for does not exist or has moved.",
            cta: "Go to homepage",
        },
        pageTitles: {
            home: "Israeli restaurant in Berlin",
            about: "About Us",
            aboutDescription:
                "The Masel Topf team: hands that turn traditions into new flavours.",
            catering: "Catering",
            cateringDescription:
                "Catering by Masel Topf – from a private dinner to an event with hundreds of guests.",
        },
    },
}
