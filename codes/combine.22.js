// @ts-nocheck

/*
load_code("combine");
combineWholeInventory();
*/
//purpose: combine items and figure shit out i dying to play man . . . .
/**
 * @param {string} itemToCompound
 */
async function combine(itemToCompound, compoundLevel = 0) {

    //prepare the requirements
    var requirements = {};
    requirements.scroll = "cscroll1";
    requirements[itemToCompound] = [];
    //walk there 
    if (locate_item(requirements.scroll) === -1) await goBuyAmount(requirements.scroll, 1);



    game_log("looking for 3 items: " + itemToCompound);
    for (var i = 0; i < character.items.length; i++) {
        //filter
        if (!character.items[i] || (character.items[i].name !== itemToCompound) || (character.items[i].level !== compoundLevel)) {
            continue;
        }
        //put into requirements
        if (requirements[itemToCompound].length < 3) {
            requirements[itemToCompound].push(i);
        }
    }
    if (requirements[itemToCompound].length === 3) {
        let success = false;

        game_log("found them fuggers: ")
        game_log("position 1: " + requirements[itemToCompound][0])
        game_log("position 2: " + requirements[itemToCompound][1])
        game_log("position 3: " + requirements[itemToCompound][2])
        game_log("ammount of cscroll1: " + quantity(requirements.scroll))
        //
        await compound(requirements[itemToCompound][0], requirements[itemToCompound][1], requirements[itemToCompound][2], locate_item(requirements.scroll));

        game_log("holy shit we just combined shit via function without touching inventory. \n")
    }
    else
        game_log("shit. no " + itemToCompound + " there to combine, start looting \n")
}
// IDEE : WENN GEWÜNSCHTES LEVEL ERREICHT CONTINUE ODER WAHRSCHEINLICHKEIIT ZU GERING
function scanInventoryForCompound() {

    var compounds = {};
    var itemName = "";
    var itemLevel = 0;
    for (var i = 0; i < character.items.length; i++) {

        if (!character.items[i]) { continue; } //filter empty inventory slots

        itemName = character.items[i].name;

        if (!G.items[itemName].compound) { continue; } //we look it up in G.items[item].compound

        itemLevel = character.items[i].level;

        //make a field if for current item if it doesnt exist, getta hell outta here.
        if (!compounds[itemName]) {
            compounds[itemName] = {};
        }
        //make a field for current level if no there
        if (!compounds[itemName][itemLevel]) {
            compounds[itemName][itemLevel] = [];
        }

        compounds[itemName][itemLevel].push(i);
    }
    game_log(JSON.stringify(compounds))
    return compounds;
}

async function combineWholeInventory() {
    //step one scan the inventory make an object with every item as you know what

game_log("combine call #" + (combineWholeInventory.calls = (combineWholeInventory.calls||0)+1))
    let compounds = scanInventoryForCompound();


    if (locate_item("cscroll1") === -1) await goBuyAmount("cscroll1", 10);
    if (!hasComputer()) { await smart_move(find_npc("newupgrade")); }
    // durch jeden typ an compounds iterieren
    for (let itemName in compounds) {
        for (let itemLevel in compounds[itemName]) {
            if (compounds[itemName][itemLevel].length >= 3) {
                let slot1 = compounds[itemName][itemLevel].pop();
                let slot2 = compounds[itemName][itemLevel].pop();
                let slot3 = compounds[itemName][itemLevel].pop();
                await compound(slot1, slot2, slot3, locate_item("cscroll1")).then(function (data) {
                    if (data.success) {
                        game_log("I have a +" + data.level + " accessory now!");
                        
                    }
                    else {
                        game_log("Rip accessories, you'll be missed.");
                        
                    }
                }).catch(e => game_log(e.reason || e.message || e));
                return combineWholeInventory();
            }
        }
    }
}



// todo : combine kriegt nur noch elemente eines arrays in dem object req 
//stattdessen wird vorher durchs ganze inventar gegangen und nachgeguckt wie viele kombinierbare items da sind
// und deren index wird gespeichert in einem array 
//dann sollte noch gecheckt werden ub die warscheinlichkeit gut genug ist wenn nicht soll eine scroll stufe höher gegangen werden (optional) 
//funktionen sauber abgrenzen, single RESPONSEBILTY PRINZIP 
//soll so lange kombinieren bis <3 von allen arten der kombinierbaren  items da sind
//var combineItem = "hpbelt";
//var combineItem = "hpamulet";
//var combineItem = "ringsj";
//combine(combineItem, 0);


// ai said do this. (review this first) 
// function 1: scanInventory()
// return type: object  → { "name_level": [index1, index2, ...], ... }
// – scannt character.items einmal komplett durch
// – gruppiert nach name + level
// – kennt nichts von "combine", "scroll" o.ä. – reine Inventur

// function 2: findCombinableGroups(groups) muss eigentlich nicht wenn wir letzten aus dem array poppen.
// return type: object  → gefiltertes Objekt, nur Gruppen mit length >= 3
// – bekommt Ergebnis von scanInventory() als Input
// – filtert raus, was NICHT genug Items hat
// – kennt nichts vom Inventar-Scannen selbst

// function 3: getScrollForLevel(level)
// return type: string  → z.B. "cscroll0" oder "cscroll1"
// – wählt passenden Scroll je nach Level/Erfolgswahrscheinlichkeit
// – optional: prüft compound_rate() und geht ggf. Scroll-Stufe hoch

// function 4: combineOnce(slots, scroll)
// return type: boolean (oder Promise<boolean>) → Erfolg ja/nein
// – bekommt genau 3 fertige Slot-Indizes + Scroll-Name
// – ruft compound() auf, loggt Ergebnis
// – macht NUR den eigentlichen Kombinier-Call, nichts anderes

// function 5: combineAll()
// return type: void (oder Promise<void>)
// – Dirigent-Funktion, ruft 1–4 in Schleife auf
// – läuft so lange, bis findCombinableGroups() nichts mehr liefert
// – scannt nach JEDEM combineOnce() neu (Indizes verschieben sich!)
