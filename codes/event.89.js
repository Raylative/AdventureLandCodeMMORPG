// @ts-nocheck


async function visit_featured_player() {
	if (state.mode !== "farm") return;
	var round = server.status.anniversary;
	var ticket = character.s.anniversary_visit;
	var status = character.anniversary;
	let safedPos = safePos();
	let wentForKiss = false;
	//let home = { map: "main", x: -60, y: -287 } dead stuff

	state.mode = "kissing";
	try {
		set_message("kissing (olala)")
		await smart_blink({ map: round.map, x: round.x, y: round.y });
		wentForKiss = true
		//await wait_for(() => (character.map === round.map && (character.x >= round.x - 100 && character.x <= round.x + 100)&& (character.y >= round.y - 100 && character.y <= round.y + 100)))
		var current = server.status.anniversary;
		ticket = character.s.anniversary_visit;
		if (character.s.hopsickness || character.s.realmfatigue ||
			!current || !current.active || !current.live || current.available === false || current.round !== round.round ||
			current.id !== round.id || !ticket || ticket.ms <= 0 ||
			Date.now() >= ticket.expires || Date.now() >= current.expires) return;

		var player = get_player(current.target);
		if (!player || distance(character, player) > 80) {
			return game_log({ reason: "distance", target: current.target });
		}
		var result = await use_skill("ikissyou", player);
		if (result.rewarded === false) game_log(result);
		// A rewarded visit grants character.s.anniversary_kiss: +10 Frequency and +6 Output for 20 minutes.

	} finally {
		if (wentForKiss) {
			try { await smart_blink(safedPos) } catch (e) { game_log(e.reason || e.message) } // CHECK IF THIS WORKS
		}
		if (state.mode === "kissing") {
			state.mode = "farm"

		}
	}
}



function canKiss() {
	var round = server.status.anniversary;
	var ticket = character.s.anniversary_visit;
	var status = character.anniversary;
	if (status && status.realm === server.region + " " + server.id &&
		round && status.round === round.round && status.reason !== "ready") {
		return false;
	}
	if (character.s.hopsickness || character.s.realmfatigue ||
		!round || !round.active || !round.live || !ticket ||
		ticket.ms <= 0 || ticket.round !== round.round ||
		ticket.realm !== server.region + " " + server.id ||
		Date.now() >= ticket.expires || Date.now() >= round.expires) {
		return false;
	}
	if (round.available === false) {
		return false
	};






	return true;
}

character.on("level_up", async function () {
    game_log("noticed level up");
    say("YESSSSSS! IM LEVEL " + character.level + " AND IT FEELS GOOD!")
    use_skill("makeawish")
    for (let i = 0; i < CONFIG.levelUp.throws; i++) {
        const idx = locate_item(CONFIG.levelUp.item);   // pro Wurf neu suchen
        if (idx === -1) return;
        try {
            await throw_item(idx, character.x, character.y + 5);
        } catch (e) {
            game_log(CONFIG.levelUp.item + " failed: " + (e.reason || e), "#ff0000");
        }
        await sleepMs(CONFIG.levelUp.pauseMs);
    }
});
