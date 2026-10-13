// @ts-nocheck
// ============================================================================
// smiley - zeichnet ein Pixel-Gesicht neben den Charakter, das die HP zeigt.
//
// Anschluss: drawHealthFace() am Ende von on_draw() aufrufen,
//            also NACH clear_drawings().
// ============================================================================

// Einstellungen. Hier kannst du Groesse und Position aendern.
const FACE = {
    pixel: 5,        // Kantenlaenge eines Pixels auf der Karte
    offsetX: 35,     // Abstand vom Charakter nach rechts
    offsetY: -95,    // Abstand nach oben (negativ = hoch)
    dark: 0x2b1b0e   // Farbe fuer Augen und Mund
};

// Die Gesichter als Raster, 8 Zeilen mit je 8 Zeichen.
//   .  = nichts zeichnen
//   o  = Gesichtsfarbe (fill)
//   #  = dunkel (Augen, Mund)
const FACES = {
    happy: {
        fill: 0xffd83b,
        rows: [
            "..oooo..",
            ".oooooo.",
            "oo#oo#oo",
            "oooooooo",
            "o#oooo#o",
            "oo####oo",
            ".oooooo.",
            "..oooo.."
        ]
    },
    okay: {
        fill: 0xffb03b,
        rows: [
            "..oooo..",
            ".oooooo.",
            "oo#oo#oo",
            "oooooooo",
            "oooooooo",
            "oo####oo",
            ".oooooo.",
            "..oooo.."
        ]
    },
    worried: {
        fill: 0xff7a3b,
        rows: [
            "..oooo..",
            ".oooooo.",
            "oo#oo#oo",
            "oooooooo",
            "oo####oo",
            "o#oooo#o",
            ".oooooo.",
            "..oooo.."
        ]
    },
    hurt: {
        fill: 0xe03b3b,
        rows: [
            "..oooo..",
            ".oooooo.",
            "oo#oo#oo",
            "oo#oo#oo",
            "oo####oo",
            "o#oooo#o",
            ".oooooo.",
            "..oooo.."
        ]
    },
    dead: {
        fill: 0x9a9a9a,
        rows: [
            "..oooo..",
            ".oooooo.",
            "o##oo##o",
            "oooooooo",
            "oooooooo",
            "oo####oo",
            ".oooooo.",
            "..oooo.."
        ]
    }
};

// Waehlt das Gesicht nach dem Anteil der HP (0 = leer, 1 = voll).
function pickFace() {
    if (character.rip) return FACES.dead;
    const ratio = character.hp / character.max_hp;
    if (ratio > 0.75) return FACES.happy;
    if (ratio > 0.5) return FACES.okay;
    if (ratio > 0.25) return FACES.worried;
    return FACES.hurt;
}

// Zeichnet mehrere gleiche Pixel nebeneinander als EINE dicke Linie.
// Die Linie ist so dick wie ein Pixel hoch ist, dadurch wird sie ein Balken.
function drawRun(left, top, row, startCol, length, color) {
    const p = FACE.pixel;
    const y = top + row * p + p / 2;   // die Linie liegt mittig in der Zeile
    draw_line(left + startCol * p, y, left + (startCol + length) * p, y, p, color);
}

// Geht das Raster durch: aussen Zeile fuer Zeile, innen Zeichen fuer Zeichen.
// Gleiche Zeichen nebeneinander werden zu einem Lauf zusammengefasst.
function drawFace(face, left, top) {
    for (let row = 0; row < face.rows.length; row++) {
        const line = face.rows[row];
        let col = 0;
        while (col < line.length) {
            const symbol = line[col];

            // zaehlen, wie oft dasselbe Zeichen direkt hintereinander steht
            let length = 1;
            while (col + length < line.length && line[col + length] === symbol) {
                length++;
            }

            if (symbol === "o") drawRun(left, top, row, col, length, face.fill);
            if (symbol === "#") drawRun(left, top, row, col, length, FACE.dark);

            col += length;   // hinter den Lauf springen
        }
    }
}

// Das ist die Funktion, die on_draw aufruft.
function drawHealthFace() {
    const left = character.x + FACE.offsetX;
    const top = character.y + FACE.offsetY;
    drawFace(pickFace(), left, top);
}
