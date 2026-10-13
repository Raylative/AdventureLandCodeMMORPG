//@ts-nocheck

//TODO: make them all single functions.
//		make a function for Blink which returns safely to prevent deleting.
//TODO: MAKE A STRATEGY KEY, DEPENDING ON THE STRAT THE WAY IT GETS EXECUTED GETS CHANGED
async function useSkillSet(target) {
	if (!is_in_range(target)) return;





	// -- Panic blink
	let targetinRange = distance(character, target) <= target.range;
	let hasManaForBlink = (character.mp - G.skills.blink.mp) >= 0;
	let ThreshHpUseBlink = character.max_hp * 0.10;
	let isHpLow = character.hp < ThreshHpUseBlink;
	let canUseBlink = can_use("blink");
	let shouldUseBlink = isHpLow && canUseBlink && hasManaForBlink;

	//DEBUG
	//game_log("--- BLINK CHECK ---", "#FFFF00");
	//game_log("1. Low HP: " + isHpLow, isHpLow ? "#00FF00" : "#FF0000");
	//game_log("2. Cooldown ready: " + canUseBlink, canUseBlink ? "#00FF00" : "#FF0000");
	//game_log("3. Mana ready: " + hasManaForBlink, hasManaForBlink ? "#00FF00" : "#FF0000");
	//game_log("shouldUseBlink: " + shouldUseBlink, shouldUseBlink ? "#00FF00" : "#FF0000");
	if (CONFIG.fight.skills.blink) {
		if (shouldUseBlink) {
			let safedPosition = { x: character.x, y: character.y };
			use_skill("blink", character);
			game_log("GET THE FUCK OUTTA THERE!!");
			game_log("HP: " + character.hp);
			game_log("Monster:" + target.name + "attack: " + target.attack);
			//await smart_move({ x: safedPosition.x, y: safedPosition.y }); //TODO: FLAG SENDEN UND DANN AN MOVE SCHICKEN. KAMPF BEENDEN

		}
	}

	// -- self protection
	if (CONFIG.fight.skills.selfprotect) {
		let hasManaforReflection = (character.mp - G.skills.reflection.mp - G.skills.blink.mp) >= 0;
		//needs method has magical dmg

		let shouldUseReflect = (state.priorTargets[0] && state.priorTargets[0].damage_type === "magical")
		if (can_use("reflection") && targetinRange && hasManaforReflection && shouldUseReflect) {
			use_skill("reflection", character);
		}
	}
	// -- burst// cburst
	if (CONFIG.fight.skills.burst) {
		//how to make out how many i can kill with my mp and then cut accorfdingly mmhhh.
		let cutMonsterTo = 1
		let mpSpend = state.priorTargets[0].hp * 2+state.priorTargets[0].resistance
		let burstTargets = state.priorTargets.map(m => [m, mpSpend])
			.slice(0, cutMonsterTo);
		for (const [targeted] of burstTargets) {
			if (!is_in_range(targeted)) return;
		}



		let ThreshManaBurst = character.max_mp * 0.5;
		let ThreshHpBurst = character.max_hp * 0.9;
		let gotMinMpForBurst = character.mp > character.max_mp * 0.8;

		let shouldUseBurst =
			(character.mp > ThreshManaBurst)
			&& (character.hp > ThreshHpBurst)
			&& (burstTargets.length > 0)
			&& (!burstTargets[0][0].target)
			&& (mpSpend < character.mp)
			//

		if (can_use("cburst") && shouldUseBurst && gotMinMpForBurst) {
			use_skill("cburst", burstTargets);
		}
	}
	//self energize 
	if (CONFIG.fight.skills.energize) {

		if (can_use("energize")) {
			use_skill("energize", character, 100);
		}
	}

	/* 	 works but i found pc so no need for now :)
		if (can_use("alchemy")) {
			if ((character.mp - G.skills.alchemy.mp)) {
				// get the first filled inventory space
				let indexFirstFilledSlot = findFirstFilledInventory();
				let nameFirstFilledSlot = character.items[indexFirstFilledSlot].name
				let compareField = ["ringsj", "hpbelt", "hpamulet","dexamulet","stramulet","wcap","mushroomstaff","dexring","strring","vitring","strbelt","dexbelt"];
				for (field of compareField) {
	
					if (nameFirstFilledSlot === field) {
						use_skill("alchemy");
					}
				}
			}
		}
		 */
}



// -- emergency Evade
//let dx = character.x-target.x;
//let dy = character.y-target.y;
//let blink ////TODO FIND OUT ABOUT BLINK MAX RANGE AND THEN. STRATEGIZE IT
