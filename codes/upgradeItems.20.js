
// @ts-nocheck

/*
load_code("upgradeItems");
upgradeItemToLevel("wgloves",7)
*/
load_code("utils");
async function tryUpgradeItemToLevel(item, desiredLevel) {
    //ITEM INFO
    let itemIndex = locate_item(item);
    //if no item go buy item
    if (itemIndex === -1) {
        await goBuyAmount(item, 1);
        itemIndex = locate_item(item);

    }
    //ITEM INFO
    let itemLevel = character.items[itemIndex].level;
    if (itemLevel >= desiredLevel) return true;
    let neededUpdates = desiredLevel - itemLevel;
    // SCROLL INFO
    let updateScroll = "scroll1";
    let scrollCount = quantity(updateScroll);
    let numNeededScrolls = 0;
    let prediction = undefined;
    //check if needed scrolls are there // TODO DAS MUSS GERFACTORED WERDEN SCROLLCOUNT WIRD NICHT NACH ERFOLG GEPRÜFT

    if (scrollCount < neededUpdates) {
        numNeededScrolls = neededUpdates - scrollCount;
        await goBuyAmount(updateScroll, numNeededScrolls);
        scrollCount = quantity(updateScroll);
    }
    let scroll1Index = locate_item(updateScroll);

    game_log("scrolls at postion: " + scroll1Index);
    game_log("quantity:" + quantity(updateScroll));
    //DAS BRAUCHT NE EIGENE FUNKTION
    if (!hasComputer()) { await smart_move(find_npc("newupgrade")); }

    for (let i = 0; i < neededUpdates; i++) {


        if (!character.items[itemIndex]) {
            game_log("captain, it appears that we lost shit. Item broke")
            return false

        }
        else {
            try {
                itemIndex = locate_item(item);
                prediction = await upgrade(itemIndex, scroll1Index, null, true)
                game_log("attempting with " + (prediction.chance * 100).toFixed(2) + " % chance")
                await upgrade(itemIndex, scroll1Index);
                scrollCount = quantity(updateScroll);
                game_log("upgraded to " + (character.items[itemIndex].level));
            } catch (error) {
                game_log(error.message);
                return false

            }
        }
    }
    //this should return wether it worked or not .
    return true;
}

// TODO upgrade fail abfangen 
//
async function upgradeAllUnitsofUntil(itemName, level) {
    let i = 1;
    let successful = false;

    let qItem = quantity(itemName);
    let itemLevel = 0;

    while (qItem > 0 && !successful) {
        qItem = quantity(itemName);

        game_log("Trying to Upgrade " + itemName + " to level " + level, '#c264cb')
        game_log("attempt: " + i, '#c264cb')
        try { successful = await tryUpgradeItemToLevel(itemName, level) } catch (e) {
            game_log("skipping item approach" + e.reason);

            await new Promise((r) => setTimeout(r, 70));
            continue
        } finally { i++; }

    }
    //and this should then take this reult and stop tring after it worked 
    return //successful TODO: RETURN A VALUE THAT INDICATES WSUCCESS
}


async function doUpgradeRoutine(level) {
    //    let wantedUpgrades = ["wattire", "wcap", "wbreeches"];
    //TODO NIMMT NICHT ALLE ITEMS MIT UND DESHALB LIST EDITIEREN. WAFFEN SLOT ohne SCROLL BERÜCKSICHTIGEN

    for (let slot in character.slots) {

        let item = character.slots[slot];
        if (!item || !(G.items[item.name].upgrade)) {

            game_log("no Equipped slot on this slot or missing Item: ")
            continue;
        }

        try {
            game_log("attempting to upgrade " + item.name + " to level " + item.level, '#d43ec5');
            await upgradeAllUnitsofUntil(item.name, item.level + 1);
        } catch (e) {
            game_log(item.Name + " failed:" + e)
        }

    };
    /*   let wantedEquipment =["firestaff","poker"]
      for(let wantedItem of wantedEquipment){
          try {upgradeAllUnitsofUntil(wantedItem,7)}catch (e) {game_log(e.reason)}
      } */

}

game_log("loaded")
