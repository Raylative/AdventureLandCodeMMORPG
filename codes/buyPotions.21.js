// simple goal: 
// buy small potions until i have 999 of each. 
//game_log(quantity("hpot0"));
//@ts-nocheck
//count all potions 
//var numTotalPot0 = 0;
//for(var item of character.items){
//    if( !item||item.name !== "pot0"){continue;}
//    if(item.q===undefined) numTotalPot0 +=1;
//    else numTotalPot0+=item.q;
//};
async function restockPotion1(wanted) {
    const mpName = "mpot1";
    const hpName = "hpot1";
    var hp_needed = Math.max(0, wanted - quantity(hpName));
    var mp_needed = Math.max(0, wanted - quantity(mpName));
    let safedPos
    if (hp_needed > 0 || mp_needed > 0) {

        if (!hasComputer()) {
            safedPos = safePos()
            await smart_move(find_npc("fancypots"));
        }



        if (hp_needed) await buy_with_gold(hpName, hp_needed);
        if (mp_needed) await buy_with_gold(mpName, mp_needed);
        if(!hasComputer())
        await smart_move(safedPos);
    }
    game_log("Potion stock is ready");
}
function checkPotionStock() {
    let shouldBuyPotions = false;
    let potionCountThresh = 100;
    let numCountPotions = { "mpot0": 0, "mpot1": 0, "hpot0": 0, "hpot1": 0 };
    let numRestockPotion = 9900;

    // count potions 
    for (let potionType in numCountPotions) {
        numCountPotions[potionType] = quantity(potionType);
    }
    //calculate action
    shouldBuyPotions = ((quantity("mpot1") < potionCountThresh || quantity("hpot1") < potionCountThresh))
    //put together

    //hier könnte ihre werbung stehen.
    return {
        shouldBuyPotions,
        numRestockPotion
    };
}

//restockPotion0().catch(function (error) {
//    game_log(error.reason || error.message || "Restock failed");
//});
