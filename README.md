# Masel Topf – Restaurant-Website

Statische Website auf Basis von [Astro](https://astro.build) + Tailwind CSS v4.
Inhalte werden in Markdown und TypeScript-Dateien gepflegt, kein CMS nötig.

Umgesetzt nach den Entwürfen in `mazel_design/` (`main`, `Menu`, `Catering`,
`about`, `contact`). Zweisprachig: Deutsch unter `/`, Englisch unter `/en`.

## Befehle

| Befehl            | Wirkung                              |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Dev-Server auf http://localhost:4321 |
| `npm run build`   | Statische Ausgabe nach `dist/`       |
| `npm run preview` | Gebaute Seite lokal prüfen           |

## Zwei Sprachen

Deutsch ist die Standardsprache und läuft ohne Präfix, Englisch liegt unter
`/en` mit englischen Adressen:

| Seite       | Deutsch        | Englisch       |
| ----------- | -------------- | -------------- |
| Startseite  | `/`            | `/en/`         |
| Speisekarte | `/speisekarte` | `/en/menu`     |
| Über Uns    | `/ueber-uns`   | `/en/about`    |
| Catering    | `/catering`    | `/en/catering` |
| Kontakt     | `/kontakt`     | `/en/contact`  |
| Impressum   | `/impressum`   | `/en/imprint`  |

### Wo was liegt

- `src/i18n/config.ts` – Sprachliste und **die Adresstabelle `routes`**. Jede
  Seite hat dort einen sprachunabhängigen Schlüssel (`menu`), daraus
  baut der Sprachumschalter das Gegenstück. Neue Seite = neuer Eintrag hier.
- `src/i18n/ui.ts` – alle Bedienungstexte je Sprache: Navigation, Knöpfe,
  Formularfelder, aria-Labels und die Motivbeschreibungen der Bildplatzhalter.
- `src/i18n/content.ts` – die Fließtexte der Seiten je Sprache.
- `src/content/menu/de/`, `src/content/menu/en/` – die Speisekarte je Sprache,
  eine Datei pro Kategorie. Beide Ordner brauchen dieselben Kategorien in
  derselben `order`.
- `src/content/pages/de/`, `src/content/pages/en/` – schlichte Inhaltsseiten.
  Das Feld `route:` im Frontmatter verbindet die Sprachfassungen; ohne es
  findet der Sprachumschalter das Gegenstück nicht.

### Eine neue Seite anlegen

1. Schlüssel und beide Adressen in `routes` (`src/i18n/config.ts`) eintragen.
2. Texte in `src/i18n/ui.ts` und ggf. `src/i18n/content.ts` ergänzen.
3. Gemeinsamen Baustein unter `src/components/pages/` schreiben, er bekommt
   `language` als Eigenschaft.
4. Zwei dünne Routendateien anlegen, die nur diesen Baustein aufrufen:
   `src/pages/neue-seite.astro` und `src/pages/en/new-page.astro`.

Die Seitenrümpfe liegen absichtlich in `src/components/pages/`, damit die
Auszeichnung nicht doppelt gepflegt werden muss – die Dateien unter
`src/pages/` sind reine Weichen.

Die englischen Texte sind Übersetzungen der deutschen Entwurfstexte und sollten
vor dem Livegang von einem Muttersprachler gegengelesen werden.

## Bilder

Aus `mazel_design/` sind drei Fotos eingebaut (in `src/assets/`):

| Datei                   | wo                                   |
| ----------------------- | ------------------------------------ |
| `logo-masel-topf.png`   | Kopfzeile (120 px) und Fußzeile (215 px) |
| `hero-grill.png`        | Heroaufnahme der Startseite          |
| `facade-terrace.png`  | Collage der Startseite, großes Bild links |
| `dishes-from-above.png` | Collage der Startseite, kleines Bild rechts |
| `dish-grilled-lamb.png`, `dish-dr-shawarma.png`, `dish-jerusalem-grill.png` | die drei Karten im Block „Sie werden es unbedingt ausprobieren wollen“ |
| `laid-table.png` | Catering-Block (Startseite und Über Uns) |
| `table-with-beer.png` | Bildspalte bei den Bewertungen |
| `tile-1…5-*.png` | Bildband am Fuß der Startseite (256 \| 336 \| 336 \| 336 \| 256 px breit) |
| `menu-banner-pita-in-paper.jpg` | Banner der Speisekarte |
| `menu-band-1…5-*.png` | die fünf Bänder zwischen den Kartenblöcken |
| `about-banner-table-with-matzo.png` | Banner von Über Uns |
| `about-signature-aubergine.png` | Über Uns, vorderes Foto |
| `about-dining-room.png` | Über Uns, Foto dahinter |
| `catering-banner-dessert.png` | Banner von Catering |
| `catering-format-1…3-*.{jpg,png}` | die drei Formatkarten (Firmen, Hochzeiten, Geburtstage) |

Sie laufen über `<Image>` aus `astro:assets`: Astro erzeugt beim Build
verkleinerte WebP-Fassungen samt `srcset` (zusammen rund 400 kB statt 15 MB
Vorlagen).

Die beiden Collagenfotos sind im Querformat, die Rahmen im Entwurf im
Hochformat – sie werden also beschnitten. Die Fokuspunkte sind bewusst gesetzt:
die Fassade rechtsbündig (`object-right`), damit Schriftzug und Menütafel im
Bild bleiben, die Gerichte leicht links der Mitte, damit die Platte zentriert
sitzt. Wenn Hochformat-Vorlagen vorliegen, können die `object-*`-Angaben
entfallen.

### Die drei Gerichtekarten der Startseite

Welche Gerichte dort erscheinen, steht in `src/data/dish-images.ts`:
`carouselKeys` legt die Reihenfolge fest, `dishImages` ordnet jedem
Schlüssel ein Foto zu. Der Schlüssel selbst steht im Frontmatter der
Speisekarte (`key:`) und ist in beiden Sprachen derselbe – Name,
Beschreibung und Preis kommen also weiterhin nur aus `src/content/menu/`.

Eine Karte hinzufügen: Foto nach `src/assets/`, Schlüssel im Frontmatter des
Gerichts setzen (in `de/` **und** `en/`), beides in `dish-images.ts`
eintragen. Drei Karten füllen bei 1520 px genau die Breite; bei mehr Karten
sollte `lg:grid-cols-3` in `src/components/DishCarousel.astro` mitwachsen.

Die Vorlagen liegen nur in 420 × 524 px vor, also in einfacher Auflösung. Für
scharfe Darstellung auf Retina-Bildschirmen wären Exporte in 840 × 1048 px
nötig.

### Das Bannerbild der Speisekarte ist beschnitten

`menu-banner-pita-in-paper.jpg` ist nicht die Vorlage, sondern ein Beschnitt
daraus. Die Vorlage `mazel_design/menu-page/1.jpg` ist hochkant (3277 × 4096), das
Band aber 1520 × 348 px. Unbeschnitten hätte Astro rund 1 MB ausgeliefert, von
dem `object-cover` über 80 % wieder abschneidet. Der Beschnitt sitzt bei 62 %
der Höhe – dort, wo der Entwurf das Motiv zeigt – und ist auf 3040 × 696 px
gerechnet, also die doppelte Entwurfsbreite.

Soll der Bildausschnitt anders liegen, neu aus `mazel_design/menu-page/1.jpg`
beschneiden, nicht die object-position verstellen: sonst wächst die Datei
wieder auf das Vierfache.

### Symbole

Die Vektoren aus `mazel_design/` liegen als Astro-Bausteine unter
`src/components/icons/`: `ForkSpoon.astro` (gekreuzte Gabel und Löffel in den
Gerichtekarten) und `Chevron.astro` (Pfeile der Bewertungen). Beide tragen
`fill="currentColor"` statt der festen Farbe der Vorlage, damit sie die
Textfarbe erben und auf hellem wie dunklem Grund verwendbar sind. Für die
Gegenrichtung wird der Chevron gespiegelt (`-scale-x-100`), nicht als zweite
Datei geführt.

### Fokuspunkte sind gemessen, nicht geschätzt

Die Entwürfe liefern die Fotos im Querformat, mehrere Rahmen sind aber
hochkant – dort schneidet `object-cover` zwangsläufig ab. Welcher Ausschnitt
gemeint ist, wurde durch Vergleich mit den Entwurfs-PNGs bestimmt (Abgleich
über Kantenbilder), nicht nach Augenmaß:

| Bild                      | object-position |
| ------------------------- | --------------- |
| Über Uns, vorderes Foto   | Mitte           |
| Über Uns, Foto dahinter   | `45% center`    |
| Über Uns, Banner          | `center 30%`    |
| Catering, Banner          | `center top`    |
| Startseite, Fassade       | `object-right`  |
| Startseite, Gerichte      | `45% center`    |

Kommen Hochformat-Vorlagen nachgeliefert, können diese Angaben entfallen.

### Zu kleine Vorlagen

Zwei Exporte sind kleiner als die Fläche, auf der sie erscheinen:

| Datei                   | Vorlage   | Rahmen im Entwurf | fehlt          |
| ----------------------- | --------- | ----------------- | -------------- |
| `dish-*.png`         | 420 × 524 | 420 × 524         | 2× für Retina  |
| `laid-table.png`   | 430 × 325 | 666 × 651         | schon bei 1×   |
| `tile-*.png`            | 336 hoch  | 336 hoch          | 2× für Retina  |

`laid-table.png` wird also rund 1,5-fach hochskaliert und wirkt weich.
Astro vergrößert nicht von selbst; nötig wäre ein Export in mindestens
666 px Breite, für Retina 1332 px.

**Alle übrigen Fotos sind noch graue Platzhalter.** Dafür gibt es genau einen
Baustein, `src/components/Placeholder.astro`. Sobald echte Fotos vorliegen,
wird jeder Aufruf durch ein Bild ersetzt:

```astro
<!-- vorher -->
<Placeholder ratio="3/4" label={t.images.diningRoom} />

<!-- nachher -->
<Image src={diningRoomImage} alt={t.images.diningRoom} class="h-full w-full object-cover" />
```

Die Motivbeschreibungen stehen je Sprache in `src/i18n/ui.ts` unter `images`
und werden beim Einsetzen zum alt-Text. Ebenfalls noch Platzhalter: die Karte
auf `/kontakt` (dort gehört eine Karteneinbettung hin).

## Inhalte pflegen

### Speisekarte — `src/content/menu/<language>/*.md`

Eine Datei pro Kategorie und Sprache, der Dateiname bestimmt nichts, die
Reihenfolge steuert `order`. `group` entscheidet, in welchem Abschnitt der Seite die Kategorie
erscheint:

- `lunch-special` – oberer Block „Mittagsspecial“
- `set-menus` – mehrgängige Menüs, nutzt `menus:` statt `dishes:`
- `menu` (Standard) – die Hauptkarte; je vier Kategorien bilden einen Block,
  dazwischen liegt ein Bildband

```markdown
---
title: Mezze
order: 6
group: menu
note: Optionaler Hinweis unter der Überschrift
dishes:
  - name: Hummus
    description: hausgemachter Hummus mit Tahina Sauce   # optional
    price: 8.5              # Zahl, Punkt als Trennzeichen → „8,5 €“
    priceText: p.P 16,0 €   # optional, ersetzt price bei Sonderfällen
    tags: [vegetarian]     # ergibt das V-Abzeichen
    variantsNote: wahlweise mit   # optional
    variants:                        # Aufpreise
      - name: Hähnchensteak
        price: 6.5
---

Optionaler Fließtext, erscheint unter der Kategorie.
```

Set-Menüs:

```markdown
---
title: Set Menus
order: 5
group: set-menus
menus:
  - label: Menü 1
    name: Glücklich und Gesund
    priceText: 31 €
    courses:
      - title: 1. Gang - Ziegenkäse Salat
        description: mit gemischtem Salat und Pinienkernen
---
```

### Seitentexte — `src/i18n/content.ts`

Alle Fließtexte, Kennzahlen, Bewertungen und Aufklapp-Punkte der fünf Seiten,
je Sprache. Startseite, Über Uns, Catering und Kontakt haben eigene Layouts und
lesen ihre Texte von hier.

### Stammdaten — `src/data/restaurant.ts`

Nur sprachunabhängige Angaben: Name, Wortmarke, Adresse, Telefon, E-Mail,
Social-Links. Übersetzbares (Claim, Zitat, Bezeichnung der Öffnungstage) steht
in `src/i18n/content.ts`, Navigation und Fußzeilen-Links in `src/i18n/ui.ts`.

### Weitere Inhaltsseiten — `src/content/pages/<language>/*.md`

Der Dateiname wird zur URL (`de/impressum.md` → `/impressum`,
`en/imprint.md` → `/en/imprint`). Diese Seiten nutzen das schlichte Layout mit
Banner und Fließtext und brauchen im Frontmatter ein `route:`-Feld.

## Struktur

```
src/
├─ content/menu/de|en/     Speisekarte je Sprache (Markdown)
├─ content/pages/de|en/   schlichte Inhaltsseiten (Markdown)
├─ content.config.ts       Schema der Markdown-Felder
├─ i18n/config.ts          Sprachen + Adresstabelle
├─ i18n/ui.ts              Bedienungstexte je Sprache
├─ i18n/content.ts         Fließtexte der Seiten je Sprache
├─ data/restaurant.ts      sprachunabhängige Stammdaten
├─ components/             Header, Footer, Placeholder, Reviews, …
├─ components/pages/      die Seitenrümpfe, nehmen `language` als Eigenschaft
├─ layouts/                Grundgerüst inkl. Meta-Tags und Schriften
├─ pages/                  Routen deutsch, pages/en/ Routen englisch
└─ styles/global.css       Tailwind-Theme (Farben, Schriften, Utilities)
```

## Offen

- Außer Logo, Hero und den zwei Collagenfotos sind alle Bilder Platzhalter.
- Karteneinbettung auf `/kontakt` fehlt.
- Noch ohne Vorlage: das Band nach dem Intro auf `/catering` (im Entwurf
  348 px hoch, Motiv „Hähnchen mit Risotto“) und der Banner von `/kontakt`.
- Formulare (Kontakt, Newsletter) zeigen auf `/nachricht` bzw. `/newsletter` –
  beides noch ohne Endpunkt.
- `site` in `astro.config.mjs` auf die echte Domain setzen – erst dann liefert
  das Layout canonical- und hreflang-Angaben aus.
- Verlinkt, aber noch nicht angelegt (je Sprache): `/reservierung`,
  `/privat-dinning`, `/gutschein`, `/feedback`, `/cookies`, `/datenschutz`.
- Die englischen Übersetzungen brauchen ein Lektorat.
- Impressum enthält Platzhalterdaten und muss vor dem Livegang ersetzt werden.
