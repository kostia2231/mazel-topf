import type { Language } from "./config"

interface Review {
    title: string
    text: string
    stars: number
    author: string
}

interface Content {
    claim: string
    description: string
    quote: string
    openingHours: { days: string; hours: string }[]
    reviews: Review[]
    cateringBlock: {
        eyebrow: string
        title: string
        paragraphs: string[]
        points: { title: string; text: string }[]
        stats: { value: string; text: string; color: "brick" | "navy" }[]
        cta: string
    }
    home: {
        hero: { title: string; subline: string; cta: string }
        about: {
            eyebrow: string
            title: string
            paragraphs: string[]
            cta: string
            stamp: string
        }
        dishes: { title: string; text: string; cta: string; slogan: string[] }
    }
    aboutPage: {
        kitchen: {
            eyebrow: string
            title: string
            paragraphs: string[]
            cta: string
        }
        stats: { value: string; text: string }[]
    }
    cateringPage: {
        title: string
        paragraphs: string[]
        cta: string
        slogan: string[]
        formats: { title: string; text: string }[]
        stats: { value: string; text: string }[]
    }
    contactPage: { title: string; text: string }
    closingBlock: { title: string; text: string; cta: string }
}

const de: Content = {
    claim: "Zeitgenössische israelische Küche",
    description:
        "Masel Topf – zeitgenössische israelische Küche im Prenzlauer Berg. Familienrezepte, " +
        "orientalische Gewürze und Berliner Rhythmus in einem Haus.",
    quote:
        "„Masel Topf ist nicht nur ein Restaurant, sondern eine lebendige Bühne, auf der " +
        "Familienlegenden, orientalische Gewürze und Berliner Rhythmus aufeinandertreffen. " +
        "Mitten im Herzen der Stadt gelegen, bringt es eine Prise Tradition und einen Hauch " +
        "Geschichte in den Alltag.“",
    openingHours: [
        { days: "Montag - Freitag", hours: "12:00 - 24:00" },
        { days: "Samsatag - Sontag", hours: "9:00 - 24:00" },
    ],
    reviews: [
        {
            title: "Toller Ort zum Abendessen in Berlin!",
            text:
                "Das Essen, das wir bestellt haben, war ausgezeichnet! Hähnchensteak und Hackfleischspieß " +
                "wurden auf dem Grill zubereitet und sehr saftig. Der Salat war knusprig frisch, und die " +
                "Servierschüssel war aus dünnem Teig, der auf offener Flamme gebacken wurde. Honigbrust " +
                "wurde mit Süßkartoffelpüree serviert und schmilzt im Mund. Unser Kompliment an ihren " +
                "Chefkoch 🙂 Das Personal war freundlich und hilfsbereit! Wir empfehlen diesen Ort für " +
                "jeden Anlass.",
            stars: 5,
            author: "Nina P",
        },
        {
            title: "Israelische Küche auf höchstem Niveau",
            text:
                "Wir waren zu sechst und haben uns quer durch die Mezze probiert – jede Schüssel ein " +
                "eigener Charakter. Besonders der Baba Ghanoush und die Eggplant Rolls sind uns im " +
                "Gedächtnis geblieben. Dazu ein aufmerksamer Service, der jede Frage zur Karte " +
                "beantworten konnte. Wir kommen mit Sicherheit wieder.",
            stars: 5,
            author: "Daniel K",
        },
        {
            title: "Unser Lieblingsplatz im Prenzlauer Berg",
            text:
                "Die Atmosphäre ist warm und unaufgeregt, man sitzt gemütlich und wird nicht gehetzt. " +
                "Wir haben hier den Geburtstag meiner Mutter gefeiert – das Team hat die Tafel liebevoll " +
                "eingedeckt und das Menü genau auf uns abgestimmt. Ein Abend, über den in der Familie " +
                "noch lange gesprochen wurde.",
            stars: 5,
            author: "Miriam L",
        },
    ],
    cateringBlock: {
        eyebrow: "Private Veranstaltungen & Catering",
        title: "Gerne veranstalten wir für Sie ein besonderes Event. Im Restaurant oder bei Ihnen vor Ort.",
        paragraphs: [
            "Unser oberstes Gebot bei Masel Topf lautet: Bei uns fühlt sich jeder Gast immer wohl und " +
                "jede Veranstaltung wird zu einer unvergesslichen, herzlichen Begegnung.",
            "Unser Catering-Ansatz beschränkt sich nicht nur auf das Essen. Das ist Liebe zum Detail, " +
                "gemütliche Atmosphäre und ein Geschmack, der in Erinnerung bleibt.",
        ],
        points: [
            {
                title: "Private Abendessen und Veranstaltungen",
                text:
                    "Ein Tisch nur für Ihre Gäste – abgestimmtes Menü, ruhiger Rahmen und ein Team, " +
                    "das den Abend im Hintergrund trägt.",
            },
            {
                title: "Hochzeiten mit israelischem Flair",
                text:
                    "Lassen Sie Ihre Feier wahrhaftig lebendig werden – mit den Aromen des Orients, " +
                    "farbenfrohen Gerichten und gefühlvoller Präsentation.",
            },
            {
                title: "Geburtstage, über die man reden kann",
                text:
                    "Von der kleinen Tafel bis zum großen Empfang: Wir planen Menü, Ablauf und Service " +
                    "so, dass Sie selbst mitfeiern können.",
            },
        ],
        stats: [
            {
                value: "1300",
                text: "Gäste haben unser Restaurant bewertet",
                color: "brick",
            },
            {
                value: "4,8",
                text: "Die durchschnittliche Bewertung, die wir erhalten haben",
                color: "navy",
            },
        ],
        cta: "Buchen Sie Ihre Veranstaltung",
    },
    home: {
        hero: {
            title: "Ein Geschmack,\nden Sie nicht vergessen werden",
            subline: "Wo jedes Gericht eine Geschichte erzählt.",
            cta: "Alle Speisekarten anzeigen",
        },
        about: {
            eyebrow: "Masel Topf – zeitgenössische israelische Küche.",
            title: "Tradition, die lebt.\nAtmosphäre zum Verweilen.",
            paragraphs: [
                "Masel Topf ist ein neues Kapitel im Berliner Gastronomieleben geworden – mit einer " +
                    "Seele aus dem Mittelmeerraum und einem im Prenzlauer Berg geborenen Charakter.",
                "Ein Restaurant, in dem jedes Gericht eine Geschichte erzählt: im Herzen der Stadt, " +
                    "inmitten gemütlicher Straßen, ganz in der Nähe der wichtigsten Sehenswürdigkeiten " +
                    "der Hauptstadt.",
                "Hier werden Familienrezepte sorgfältig kombiniert, wodurch die Einzigartigkeit Israels " +
                    "und die Freiheit der Berliner kulinarischen Szene bewahrt werden. Bei jedem Besuch " +
                    "geht es hier um mehr als nur Essen.",
                "Masel Topf ist ein Ort, an den die Menschen zurückkehren. Nicht aus Gewohnheit, " +
                    "sondern aus Liebe.",
            ],
            cta: "Erfahren Sie mehr über uns",
            stamp: "Israelisches Restaurant · seit 2022 · Masel Topf ·",
        },
        dishes: {
            title: "Sie werden es unbedingt ausprobieren wollen",
            text:
                "Bei Masel Topf finden Sie für jeden Anlass das passende Gericht. Ob große Firmentagung " +
                "oder Firmenevent, Familienessen oder Date, wir bieten Ihnen immer etwas Unvergessliches.",
            cta: "Alle Speisekarten anzeigen",
            slogan: [
                "Wir bieten Ihnen ein kulinarisches Erlebnis der Extraklasse.",
                "Unser Ziel ist es, exklusive und zugleich ungezwungene kulinarische Erlebnisse zu schaffen.",
            ],
        },
    },
    aboutPage: {
        kitchen: {
            eyebrow: "Treffen Sie unsere Köche",
            title: "Hände, die Traditionen in neue Geschmäcker verwandeln",
            paragraphs: [
                "Das Team von Masel Topf besteht aus Meistern, für die die israelische Küche nicht nur " +
                    "Inspiration, sondern eine persönliche Geschichte ist.",
                "Sie sammeln sorgfältig Rezepte aus der Kindheit, wählen sorgfältig die frischesten " +
                    "Produkte aus und verbessern und erfinden ständig neue Techniken, um Gerichte zu " +
                    "kreieren, die Generationen zum Leben erwecken.",
                "Jeder Koch geht seinen eigenen Weg, von Familienrezepten bis hin zu Fusion-" +
                    "Interpretationen. Und zusammen machen sie Masel Topf zu dem, was Sie kennen: warm, " +
                    "kräftig und authentisch.",
            ],
            cta: "Einen Tisch reservieren",
        },
        stats: [
            { value: "1837", text: "Bewertungen von Gästen" },
            { value: "4,8", text: "Die durchschnittliche Bewertung" },
            { value: "80+", text: "Buchungen pro Tag" },
            { value: "100", text: "Gerichte auf der Speisekarte" },
        ],
    },
    cateringPage: {
        title: "Tadelloses Catering mit Charakter Masel Topf",
        paragraphs: [
            "Egal, ob Sie ein wichtiges Familienfest feiern oder eine Geschäftsveranstaltung " +
                "organisieren, das Team von Masel Topf schafft eine Atmosphäre, in der jeder Gast Wärme, " +
                "Geschmack und Liebe zum Detail spürt.",
            "Wir bieten flexible Formate und durchdachte Catering-Pakete – vom intimen Abendessen bis " +
                "zum großen Empfang – mit Schwerpunkt auf modernen Interpretationen der israelischen " +
                "Küche und hochwertigem Service.",
            "Was auch immer Sie feiern, es wird ein ganz besonderer Moment sein, über den man spricht. " +
                "Schreiben Sie uns und wir informieren Sie über alle Details und Sonderkonditionen.",
        ],
        cta: "Buchen Sie Ihre Veranstaltung",
        slogan: [
            "Wir bringen die Atmosphäre, den Geschmack und die Sorgfalt mit, die uns in den Saal so " +
                "beliebt machen – wo auch immer Sie uns einladen.",
            "Vom privaten Abendessen bis hin zu Veranstaltungen mit Hunderten von Gästen passen wir " +
                "uns Ihnen an und sorgen dafür, dass alles schön, köstlich und stressfrei verläuft.",
        ],
        formats: [
            {
                title: "Firmen-\nveranstaltungen",
                text:
                    "Treffen Sie Ihre Partner, begeistern Sie Ihr Team und überraschen Sie Ihre Gäste – " +
                    "wir organisieren das Catering, das zu Ihrem Image passt. Moderne israelische Küche, " +
                    "präzise Präsentation und tadelloser Service – alles, um Ihre Marke unvergesslich zu machen.",
            },
            {
                title: "Hochzeiten\nund private Feiern",
                text:
                    "Ihr Fest in den Aromen des Orients: abgestimmte Menüs, festlich eingedeckte Tafeln " +
                    "und ein Team, das jeden Ablauf im Blick behält – damit Sie einfach feiern können.",
            },
            {
                title: "Geburtstage\nund Hauspartys",
                text:
                    "Ob im Restaurant oder bei Ihnen zu Hause: Wir bringen Gerichte, Geschirr und Service " +
                    "mit und verwandeln den Abend in eine entspannte, herzliche Feier.",
            },
        ],
        stats: [
            { value: "150+", text: "Veranstaltungen durchgeführt" },
            { value: "200+", text: "Gäste bei Veranstaltungen" },
            { value: "15+", text: "Menütypen für jedes Format" },
            {
                value: "48",
                text: "Stunden von der Anfrage bis zum fertigen Catering",
            },
        ],
    },
    contactPage: {
        title: "Wir freuen uns immer,\nSie zu sehen",
        text:
            "Bei Fragen, Anregungen, Beschwerden oder Wünschen schreiben Sie uns einfach und wir " +
            "antworten Ihnen innerhalb von 24 Stunden.",
    },
    closingBlock: {
        title: "Entdecken Sie einen Ort,\nin den Sie sich einfach verlieben müssen – Masel Topf",
        text:
            "Wir freuen uns immer, Sie bei Masel Topf begrüßen zu dürfen – einem Ort, an dem moderne " +
            "israelische Küche auf die Wärme einer familiären Atmosphäre trifft. Der perfekte Ort für " +
            "besondere Anlässe, gemütliche Zusammenkünfte und Abende, an die Sie gerne zurückkehren.",
        cta: "Einen Tisch reservieren",
    },
}

const en: Content = {
    claim: "Contemporary Israeli cuisine",
    description:
        "Masel Topf – contemporary Israeli cuisine in Prenzlauer Berg. Family recipes, " +
        "oriental spices and Berlin rhythm under one roof.",
    quote:
        "“Masel Topf is not just a restaurant but a living stage where family legends, oriental " +
        "spices and Berlin rhythm meet. Right in the heart of the city, it brings a pinch of " +
        "tradition and a touch of history into everyday life.”",
    openingHours: [
        { days: "Monday – Friday", hours: "12:00 - 24:00" },
        { days: "Saturday – Sunday", hours: "9:00 - 24:00" },
    ],
    reviews: [
        {
            title: "Great place for dinner in Berlin!",
            text:
                "The food we ordered was excellent! The chicken steak and the minced meat skewer were " +
                "grilled and very juicy. The salad was crisp and fresh, and the serving bowl was made " +
                "of thin dough baked over an open flame. The honey breast came with sweet potato purée " +
                "and melts in your mouth. Our compliments to the chef 🙂 The staff were friendly and " +
                "helpful! We recommend this place for any occasion.",
            stars: 5,
            author: "Nina P",
        },
        {
            title: "Israeli cuisine at its very best",
            text:
                "There were six of us and we worked our way through the mezze – every bowl with a " +
                "character of its own. The baba ghanoush and the eggplant rolls in particular stayed " +
                "with us. Add attentive service that could answer every question about the menu. " +
                "We will certainly be back.",
            stars: 5,
            author: "Daniel K",
        },
        {
            title: "Our favourite spot in Prenzlauer Berg",
            text:
                "The atmosphere is warm and unhurried; you sit comfortably and nobody rushes you. " +
                "We celebrated my mother’s birthday here – the team laid the table with great care and " +
                "tailored the menu precisely to us. An evening the family talked about for a long time.",
            stars: 5,
            author: "Miriam L",
        },
    ],
    cateringBlock: {
        eyebrow: "Private events & catering",
        title: "We would love to host your special event. At the restaurant or at your place.",
        paragraphs: [
            "Our first rule at Masel Topf: every guest should always feel at home, and every event " +
                "should become a memorable, warm-hearted occasion.",
            "Our approach to catering is about more than the food. It is attention to detail, a " +
                "welcoming atmosphere and a taste that stays with you.",
        ],
        points: [
            {
                title: "Private dinners and events",
                text:
                    "A table just for your guests – a menu chosen together, a quiet setting and a team " +
                    "that carries the evening in the background.",
            },
            {
                title: "Weddings with an Israeli touch",
                text:
                    "Let your celebration truly come alive – with the aromas of the Levant, colourful " +
                    "dishes and presentation full of feeling.",
            },
            {
                title: "Birthdays worth talking about",
                text:
                    "From a small table to a large reception: we plan the menu, the timing and the " +
                    "service so that you can celebrate along with everyone else.",
            },
        ],
        stats: [
            {
                value: "1300",
                text: "guests have reviewed our restaurant",
                color: "brick",
            },
            {
                value: "4.8",
                text: "the average rating we have received",
                color: "navy",
            },
        ],
        cta: "Book your event",
    },
    home: {
        hero: {
            title: "A taste\nyou will not forget",
            subline: "Where every dish tells a story.",
            cta: "View all menus",
        },
        about: {
            eyebrow: "Masel Topf – contemporary Israeli cuisine.",
            title: "Living tradition.\nAn atmosphere to linger in.",
            paragraphs: [
                "Masel Topf has become a new chapter in Berlin’s dining scene – with a Mediterranean " +
                    "soul and a character born in Prenzlauer Berg.",
                "A restaurant where every dish tells a story: in the heart of the city, among quiet " +
                    "streets, close to the capital’s most important sights.",
                "Here family recipes are combined with care, preserving both the singularity of Israel " +
                    "and the freedom of Berlin’s culinary scene. Every visit here is about more than " +
                    "just eating.",
                "Masel Topf is a place people come back to. Not out of habit, but out of love.",
            ],
            cta: "Learn more about us",
            stamp: "Israeli restaurant · since 2022 · Masel Topf ·",
        },
        dishes: {
            title: "You will definitely want to try these",
            text:
                "At Masel Topf there is a dish for every occasion. A large company meeting or a " +
                "corporate event, a family dinner or a date – we always have something memorable for you.",
            cta: "View all menus",
            slogan: [
                "We offer you a culinary experience of the highest order.",
                "Our aim is to create culinary experiences that are exclusive and relaxed at the same time.",
            ],
        },
    },
    aboutPage: {
        kitchen: {
            eyebrow: "Meet our chefs",
            title: "Hands that turn traditions into new flavours",
            paragraphs: [
                "The Masel Topf team is made up of masters for whom Israeli cuisine is not only an " +
                    "inspiration but a personal story.",
                "They carefully collect recipes from childhood, carefully select the freshest produce " +
                    "and constantly refine and invent techniques to create dishes that bring generations " +
                    "back to life.",
                "Every chef follows their own path, from family recipes to fusion interpretations. And " +
                    "together they make Masel Topf what you know it to be: warm, bold and authentic.",
            ],
            cta: "Book a table",
        },
        stats: [
            { value: "1837", text: "reviews from guests" },
            { value: "4.8", text: "the average rating" },
            { value: "80+", text: "bookings per day" },
            { value: "100", text: "dishes on the menu" },
        ],
    },
    cateringPage: {
        title: "Flawless catering with Masel Topf character",
        paragraphs: [
            "Whether you are celebrating an important family occasion or organising a business event, " +
                "the Masel Topf team creates an atmosphere in which every guest feels warmth, taste and " +
                "attention to detail.",
            "We offer flexible formats and well-considered catering packages – from an intimate dinner " +
                "to a large reception – with a focus on modern interpretations of Israeli cuisine and " +
                "high-quality service.",
            "Whatever you are celebrating, it will be a truly special moment that people talk about. " +
                "Write to us and we will tell you all the details and special terms.",
        ],
        cta: "Book your event",
        slogan: [
            "We bring along the atmosphere, the taste and the care that make us so well loved in our " +
                "own dining room – wherever you invite us.",
            "From a private dinner to events with hundreds of guests, we adapt to you and make sure " +
                "everything is beautiful, delicious and stress-free.",
        ],
        formats: [
            {
                title: "Corporate\nevents",
                text:
                    "Meet your partners, inspire your team and surprise your guests – we organise the " +
                    "catering that fits your image. Modern Israeli cuisine, precise presentation and " +
                    "flawless service – everything to make your brand unforgettable.",
            },
            {
                title: "Weddings\nand private parties",
                text:
                    "Your celebration in the aromas of the Levant: menus chosen together, festively laid " +
                    "tables and a team that keeps an eye on every step – so you can simply celebrate.",
            },
            {
                title: "Birthdays\nand house parties",
                text:
                    "At the restaurant or at your home: we bring the dishes, the tableware and the " +
                    "service, and turn the evening into a relaxed, warm-hearted celebration.",
            },
        ],
        stats: [
            { value: "150+", text: "events delivered" },
            { value: "200+", text: "guests at events" },
            { value: "15+", text: "menu types for every format" },
            { value: "48", text: "hours from enquiry to finished catering" },
        ],
    },
    contactPage: {
        title: "We are always happy\nto see you",
        text:
            "If you have questions, suggestions, complaints or wishes, just write to us and we will " +
            "reply within 24 hours.",
    },
    closingBlock: {
        title: "Discover a place\nyou simply have to fall in love with – Masel Topf",
        text:
            "We are always glad to welcome you to Masel Topf – a place where modern Israeli cuisine " +
            "meets the warmth of a family atmosphere. The perfect place for special occasions, " +
            "relaxed get-togethers and evenings you will happily return to.",
        cta: "Book a table",
    },
}

export const content: Record<Language, Content> = { de, en }
