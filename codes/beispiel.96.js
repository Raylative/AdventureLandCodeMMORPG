// @ts-nocheck
// ============================================================================
// KurtUrfel (Mage) - refactored
//
//   main         Supervisor: Tod + Restock-Start (setzt state.mode)
//   maintenance  Traenke trinken, loot
//   move         Ziel suchen + bewegen
//   fight        Basisangriff
//   skill        useSkillSet (Blink, Reflection, Energize, ...)
//
// ============================================================================

/* LOAD CODE */
try { load_code("buyPotions"); } catch (e) { game_log("missing code: buyPotions", "#ff0000"); }
try { load_code("move"); } catch (e) { game_log("missing code: move", "#ff0000"); }
try { load_code("attackMage"); } catch (e) { game_log("missing code: attackMage", "#ff0000"); }
try { load_code("handleDeath"); } catch (e) { game_log("missing code: handleDeath", "#ff0000"); }
try { load_code("utils"); } catch (e) { game_log("missing code: utils", "#ff0000"); }
try { load_code("combine"); } catch (e) { game_log("missing code: combine", "#ff0000"); }
try { load_code("sell"); } catch (e) { game_log("missing code: sell", "#ff0000"); }
try { load_code("upgradeItems"); } catch (e) { game_log("missing code: upgradeItems", "#ff0000"); }
try { load_code("Presents"); } catch (e) { game_log("missing code: presents", "#ff0000"); }
try { load_code("kiss"); } catch (e) { game_log("missing code: kiss", "#ff0000"); }
try { load_code("eventManager"); } catch (e) { game_log("missing code: eventManager", "#ff0000"); }
try { load_code("visuals"); } catch (e) { game_log("missing code: visuals", "#ff0000"); }
try { load_code("control"); } catch (e) { game_log("missing code: control", "#ff0000"); }


// ============================================================================
// 1. CONFIG 
// ============================================================================
const CONFIG = {
    delay: { main: 100, maintenance: 100, fight: 50, skill: 50, move: 200, visit: 10000, potion: 70 }, // ms

    fight: {
        //target filter is obsolete. anpassen an score system
        targetFilter: { no_target: false, type: "franky", path_check: false },
        maxAttackHpDivisor: 5, // maximum 
        skills: { attack: true, burst: false, selfprotect: true, blink: true, cburst: false, energize: true }
    },


    move: {
        targetRangePadding: 50, //make sure im out from bitches range
        ownRangeMargin: 10, // make sure its in my range 
        kiteBandFactor: 0.6, // how close the monster can get until kiteing starts. (half of character.range)
        
    },

    potions: {
        manaUseFraction: 0.9,  // MP-Trank unter 70 % von max_mp
        restockBelow: 100,     // Restock, wenn hpot1 oder mpot1 darunter fallen
        restockAmount: 1000,   // 
    },

    levelUp: { item: "confetti", throws: 3, pauseMs: 4000 }, //throw confetti at levelUp :D
};

// STATICS

const STATIC = {
    hpotHeal: G.items.hpot1.gives[0][1],
    mpotHeal: G.items.mpot1.gives[0][1]
};


// 3. derived - values depend on char. (no need to actually read this every every loop.)
//TODOS: has pc value: no need for travel anymore :D :D :D :D :D :D 
const derived = {
    hpUseBelow: () => character.max_hp - STATIC.hpotHeal,
    mpUseBelow: () => character.max_mp * CONFIG.potions.manaUseFraction,
    targetMaxAtk: () => character.hp / CONFIG.fight.maxAttackHpDivisor,
    keepDistance: (t) => Math.min(t.range + CONFIG.move.targetRangePadding,
        character.range - CONFIG.move.ownRangeMargin),
    kiteMax: () => character.range * CONFIG.move.kiteBandFactor,
};


// 4. state - Laufzeit. In Klammern: wer schreibt.

const state = {
    mode: "farm",       // "farm" | "restock" | "dead" |    (main)
    target: null,       // (move: acquireTarget; main beim Tod)
    aggroedOnMe: null,  // (move: acquireTarget; main beim Tod)
    posNext: null,      // (move)
    targetQueue: [],
    priorTargets: [],
    stand: false,        //control //move
};


// LOOP BUILDER:
// do sleepMs(ms) to get a custom Promise with time out
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

//building loops by putting functions into the loop.
function runLoop(name, delayMs, tick) {
    // 
    (async function () {
        while (true) {
            try { await tick(); } //<- this is the Loop.
            catch (e) { game_log(name + " loop error: " + (e.reason || e.message || e), "#ff0000"); }
            await sleepMs(delayMs);
        }
    })();
}


//helperfunc: boolean if stock is low.
function needsRestock() {
    return quantity("mpot1") < CONFIG.potions.restockBelow
        || quantity("hpot1") < CONFIG.potions.restockBelow;
}
//helper function :
function inventoryFull() {
    let inventoryIsFull = true;
    for (let itemslot in character.items) {
        if (character.items[itemslot] === null) {
            inventoryIsFull = false;
            return inventoryIsFull;
        }
    }
    return inventoryIsFull
}

//main loop:
async function mainTick() {
    // if char is dead 
    if (character.rip) {
        state.mode = "dead";
        state.target = null;
        state.aggroedOnMe = null;
        try { await handleDeath(); }   // saves pos, and walks back
        finally { state.mode = "farm"; }
        change_target(undefined);
        return;
    }

    // if stock is low 
    if (state.mode === "farm" && needsRestock()) {
        state.mode = "restock";
        set_message("buying potions");
        restockPotion1(CONFIG.potions.restockAmount)
            .catch(function (e) { game_log("restock failed: " + (e.reason || e.message || e), "#ff0000"); })
            .finally(function () { if (state.mode === "restock") state.mode = "farm"; });
    }
}


//should handle inventory
async function maintenanceTick() {
    if (character.rip) return;


    loot();
    //if inventory is FULL //TODO CHECK PC 
    if (state.mode === "farm" && inventoryFull()) {
        game_log(inventoryFull());
        game_log("test, this recognized full inventory")
        if (!hasComputer()) { state.mode = "deploy"; }
        //let latestSpot = safePos()
        set_message("deploying Loot");
        try { await sellShitDirty() } catch (e) { game_log("dumping stuff failed: " + (e.reason || e.message || e), "#ff0000"); }
        try { await doUpgradeRoutine() } catch (e) { game_log("upgrading stuff failed: " + (e.reason || e.message || e), "#ff0000"); }

        await combineWholeInventory().catch(function (e) { game_log("combining stuff failed: " + (e.reason || e.message || e), "#ff0000"); })
            .finally(function () {
                if (state.mode === "deploy") {
                    state.mode = "farm";
                    //smart_move(latestSpot);
                }
            });

    }
}

// ============================================================================
// MOVE - Ziel suchen (einziger Schreiber von state.target) + bewegen
// ============================================================================
//targeting sollte iwie isoliert werden. 
//ziele sammeln.
function collectTargets() {
    //diese werte für config stellen
    state.targetQueue = parent.get_nearby_hostiles({ range: character.range * 10, limit: 16 });
}

function scoreTarget(monster) {
    //scoring system for targets. the higher the score the higher the priority.

    let score = 0
    if (monster.target === character.name) score += 10000;
    if (monster.mtype === "frog" || monster.mtype === "osnake") score += 10000;
    if (monster.xp < 0) score -= 10000000;
    if (monster.name === "Target Automatron") score -= 10000000;
    if (!can_move_to(monster.x, monster.y)) score -= 10000;
    if (monster.attack>=derived.targetMaxAtk) score -= 10000;
        //if(is_in_range(monster)) score +=100;
        if (monster.mtype === CONFIG.fight.targetFilter.type) score += 5000;
    score -= monster.c_dist / 10;
    if (monster.attack > derived.targetMaxAtk()) score -= 1000;
    //game_log(monster.name + "/" + monster.mtype + " xp=" + monster.xp + " score=" + Math.round(score) + " dist=" + Math.round(monster.c_dist));
    return score;
}
function sortTargets() {
    state.priorTargets = state.targetQueue.map(monster => ({ monster, score: scoreTarget(monster) }))
        .sort((a, b) => b.score - a.score)
        .map(entry => entry.monster)
        .filter(monster => monster.xp >= 0)
        .filter(monster => monster.name !== "Target Automatron");

}



function acquireTarget() {
    collectTargets();
    sortTargets();
    //game_log("priorTargets: " + state.priorTargets.map(m => m.name + "/" + m.mtype + " d=" + Math.round(m.c_dist)).join(", "));

    const current = get_targeted_monster();

    // Erst Monster, die schon auf mich zielen, sonst 
    //    const aggro = get_nearest_monster({ max_att: derived.targetMaxAtk(), target: character });
    //    state.aggroedOnMe = aggro || null;
    let next = undefined;
    // Aktuelles Ziel behalten, solange es auf mich zielt
    if (current && get_target_of(current) === character) {
        state.target = current;
        return;
    }

    if (state.priorTargets.length > 0) {

        next = state.priorTargets[0]
    }
    state.target = next || null;
    if (next) change_target(next);
}

async function moveTick() {
    if (state.mode !== "farm") return;
    //if(is_moving(character)) return;

    acquireTarget();
    if (!state.target) {
        set_message("No Monsters");
        let searchCriteria = { type: (CONFIG.fight.targetFilter.type) }
        let isInSight = is_in_range(searchCriteria)
        if (!is_moving(character) && !isInSight) {
            let searchedTarget = get_nearest_monster(searchCriteria)
        }
        return;
    }

    state.posNext = decideMovement(state.target);
    if (state.posNext === undefined) return;
    move(state.posNext.x, state.posNext.y);
}

function potionTick() {
    if (character.rip) return;
    if (!can_use("use_mp") && !can_use("use_hp")) return

    if (character.hp < derived.hpUseBelow() || character.mp < derived.mpUseBelow()) {
        use_hp_or_mp(); //todo optimize. its quite bad.
    }
}

// ============================================================================
// FIGHT - nur der Basisangriff
// ============================================================================
async function fightTick() {
    if (state.mode !== "farm") return;
    if (!CONFIG.fight.skills.attack) return;
    const t = state.target;
    if (!t) return;
    if (!can_attack(t) || character.mp < character.mp_cost) return;

    set_message("Attacking");
    try {

        await attack(t);
        reduce_cooldown("attack", character.ping * 0.95); // nur bei Erfolg
    } catch (e) {
        // "cooldown" und "too_far" sind normal (Distanz regelt der Move-Loop)
        if (e.reason !== "cooldown" && e.reason !== "too_far") {
            game_log("attack failed: " + (e.reason || e), "#ff0000");
        }
    }
}

// ============================================================================
// SKILL - Blink, Reflection, Energize, ... (Slot attackMage)
// ============================================================================
async function skillTick() {
    if (state.mode !== "farm") return;
    if (!state.target) return;   // useSkillSet liest target.range sofort

    await useSkillSet(state.target);
}

//dump please refactor into own targeting system



//HOTKEYS script erschaffen TODO




// ============================================================================
// START 
// ============================================================================
runLoop("main", CONFIG.delay.main, mainTick);
runLoop("maintenance", CONFIG.delay.maintenance, maintenanceTick);
runLoop("move", CONFIG.delay.move, moveTick);
runLoop("fight", CONFIG.delay.fight, fightTick);
runLoop("skill", CONFIG.delay.skill, skillTick);
runLoop("visit", CONFIG.delay.visit, visitTick);
runLoop("potion", CONFIG.delay.potion, potionTick);
game_log("finished", "#048627");

// NOTE: If the tab isn't focused, browsers slow down the game
// NOTE: Use the performance_trick() function as a workaround
