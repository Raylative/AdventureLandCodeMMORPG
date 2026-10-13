//Purpose: Craft all presents into items 



async function autoExchange(item) {
    if(!hasComputer()){await smart_move({ to: "exchange" })}
    while (quantity(item) > 0) {
        try {
            await exchange(locate_item(item))
            await new Promise((r) => setTimeout(r, 100));
        } catch (e) {
            game_log("something bad while exchange happened:" + e)
            return
        }
        // TODO HANDLE FULL INVENTORY! IMPORTANT!
    }
}
async function autoExchangeAll() {
    await autoExchange("troll");
    await autoExchange("lostearring");
    await autoExchange("anniversarygift");
    await autoExchange("gem1");
    await autoExchange("gem0");
    await autoExchange("candy1");
    await autoExchange("candy0");
    await autoExchange("weaponbox");
    await autoExchange("armorbox");
    await autoExchange("gift0");
    await autoExchange("mysterybox");
    await autoExchange("candycane");
    await autoExchange("sixcake");
    await autoExchange("leather");
}

