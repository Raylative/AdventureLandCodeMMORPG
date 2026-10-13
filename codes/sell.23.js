//@ts-nocheck
async function sell_one_plain_item(slot, expected_name) {
	var item = character.items[slot];
	if (!item || item.name !== expected_name) return;
	if (item.l || item.p || item.stat_type || item.level) {
		return game_log("Refusing to sell a modified item");
	}
	await sell(slot, 1);
}
//sell_one_plain_item(0,"wrrshoes");
//sell_one_plain_item(1,"wshoes");
//sell_one_plain_item(2,"wcap");
//sell_one_plain_item(3,"wcap");
//sell_one_plain_item(locate_item("test_orb"),"test_orb");
async function sellAllOf(itemName) {
		while (quantity(itemName) > 0) {
			let itemLocation =locate_sellable(itemName)
			if(!itemLocation)break
			await sell_one_plain_item(itemLocation, itemName)
			await new Promise((r) => setTimeout(r, 100));
		}
}

async function sellShitDirty(){

	
	await sellAllOf("hpbelt");
	await sellAllOf("hpamulet");
	await sellAllOf("ringsj");
	await sellAllOf("stinger");
	await sellAllOf("hpot0");
	await //sellAllOf("wshoes");
	await sellAllOf("slimestaff");
	await sellAllOf("dexamulet");
	await sellAllOf("stramulet");
	await sellAllOf("mushroomstaff");
	await sellAllOf("cclaw");
	await sellAllOf("strring");
	await sellAllOf("dexring");
	await sellAllOf("pants");
	await sellAllOf("pants1");
	await sellAllOf("gloves");
	await sellAllOf("gloves1");
	await sellAllOf("shoes");
	await sellAllOf("shoes1");
	await sellAllOf("coat");
	await sellAllOf("coat1");
	await sellAllOf("helmet");
	await sellAllOf("helmet1");
	await sellAllOf("hhelmet");

	//await sellAllOf("partyhat");
	await sellAllOf("vitring");
	await sellAllOf("vitscroll");
	await sellAllOf("fireblade");
	await sellAllOf("firebow");
	await sellAllOf("dexearring");
	await sellAllOf("strearring");
	await sellAllOf("vitearring");
	await sellAllOf("poker");
	await sellAllOf("cake");
	await sellAllOf("t2bow");
	await sellAllOf("sword");
	await sellAllOf("dagger");
	await sellAllOf("pumpkinspice");
	await sellAllOf("spear");
	await sellAllOf("basher");
	await sellAllOf("pmace");
	//await sellAllOf("firestaff");
	await sellAllOf("dexbelt");
	await sellAllOf("strbelt");
	await sellAllOf("wcap");
	await sellAllOf("wattire");
	await sellAllOf("wgloves");
	//await sellAllOf("lostearring");
	//await sellAllOf("wbook0");
	await sellAllOf("quiver");
	await sellAllOf("swifty");
	await sellAllOf("shield");
	await sellAllOf("throwingstars");
	await sellAllOf("harmor");
	await sellAllOf("hboots");
	await sellAllOf("hbow");
	await sellAllOf("wshoes");
	await sellAllOf("wattire");
	await sellAllOf("wgloves");
	await sellAllOf("partyhat");
	await sellAllOf("seashell");
	await sellAllOf("firestaff");
	await sellAllOf("sshield");
	await sellAllOf("beewings");
	await sellAllOf("lostearring");
	await sellAllOf("gslime");
	await sellAllOf("wbreeches");
	
	await sellAllOf("glolipop");
	await sellAllOf("ololipop");
	await sellAllOf("phelmet");
	await sellAllOf("gphelmet");
	await sellAllOf("maceofthedead");
	await sellAllOf("bowofthedead");

	
	await sellAllOf("mcape");
	
	game_log("done",'#c3ff00')
	//TODO FILTERSYSTEM FOR ITEMS
	return true;
}
//sellShitDirty();
	

function locate_sellable(itemName){
	//same es locat_item but ignores Valuable stuff

	//return first itemslot with no p or other stuff.
	for(let itemSlot in character.items){
		if(!character.items[itemSlot]) continue;
		
			if (character.items[itemSlot].l 
				|| character.items[itemSlot].p 
				|| character.items[itemSlot].stat_type 
				|| character.items[itemSlot].level)
				{
					game_log("locked: " + name + " because l/p/stat/level")
					continue;
				}
			if(character.items[itemSlot].name === itemName )return itemSlot;
	}

}
