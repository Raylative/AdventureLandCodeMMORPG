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
try { load_code("event"); } catch (e) { game_log("missing code: event", "#ff0000"); }
try { load_code("eventManager"); } catch (e) { game_log("missing code: eventManager", "#ff0000"); }
try { load_code("visuals"); } catch (e) { game_log("missing code: visuals", "#ff0000"); }
try { load_code("control"); } catch (e) { game_log("missing code: control", "#ff0000"); }
//try { load_code("smiley"); } catch (e) { game_log("missing code: smiley", "#ff0000"); }

try { load_code("expression"); } catch (e) { game_log("missing code: expression", "#ff0000"); }

// ============================================================================
// 1. CONFIG 
// ============================================================================
const CONFIG = {
    delay: { main: 100, maintenance: 100, fight: 50, skill: 50, move: 200, visit: 10000, potion: 70, jobs: 1000 },
    fooshitmonster:"mvampire",

    fight: {
        //target filter is obsolete. anpassen an score system
        targetFilter: { no_target: false, type: "rgoo", path_check: false },
        maxAttackHpDivisor: 2, // maximum 
        skills: { attack: true, burst: true, selfprotect: true, blink: true, cburst: false, energize: true },
        monsterWhitelist:
            ["goo", "squig", "bee", "porcupine", "armadillo", "crab", "frog", "osnake", "snake",
                "squigtoad", "tortoise", "croc", "bat", "arcticbee", "spider", "rat", "scorpion",
                "gscorpion", "iceroamer", "minimush", "phoenix", "ghost", "bigbird",
                "crabx", "hen", "rooster", "boar", "stoneworm", "cgoo", "rgoo", "bbpompom", "xscorpion", "poisio", "jr", "mvampire","mrpumpkin"],
        monsterBlacklist: [
            // Haustiere, Übungspuppen
            "puppy1", "puppy2", "puppy3", "puppy4", "kitty1", "kitty2", "kitty3", "kitty4",
            "target", "target_a500", "target_a750", "target_r500", "target_r750", "target_ar900", "target_ar500red",
            // Feen am Stadtrand: attack 2400 bis 4000
            "greenfairy", "redfairy", "bluefairy",
            // hohe attack oder viel HP auf normalen Maps
            "pppompom", "rimedjinn", "harpy", "rharpy", "stompy",
            "plantoid", "ent", "fireroamer", "bscorpion", "mummy", "skeletor",
            "pinkgoblin", "oneeye", "kobold", "sparkbot", "targetron", "dryad", "odino", "tinyp"
        ]

    },


    move: {
        targetRangePadding: 30, //make sure im out from bitches range
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
//===================================================================
//                               JOBS 
//===================================================================
const JOBS = [

    { when: () => character.rip, do: deathJob },
    { when: () => inventoryFull(), do: InventoryJob },
    { when: () => needsRestock(), do: PotionJob },
    { when: () => character.hp<character.max_hp/3, do: wait_for_nice_health },
    //{ when: () => needsRecharge(), do: stopJob },

    { when: () => eventGoing(), do: pickAndVisitEvent },
    { when: () => shouldVisitDaisy(), do: interactMonsterhunt },
    { when: () => isHuntDoable(), do: monsterQuestRoutine },
    { when: () => isFoo(), do: fooshit }
]

const EVENTS = [

    { when: () => canKiss(), do: visit_featured_player },
    //{ when: () => miau(), do: miau }
]

function eventGoing(){
    for(let event of EVENTS)
        if(event.when())return true;
    return false;
}
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
    rechargeHpBelow: () => character.max_hp/2,
    rechargeMpBelow: () => character.max_mp/2
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
    monsterQuest: {},  //current monster hunt
    finishFight: null
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
function needsRecharge(){
        return character.mp < derived.rechargeMpBelow
        || character.hp < derived.rechargeHpBelow;
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




    // if stock is low 

}


//should handle inventory
async function maintenanceTick() {
    if (character.rip) return;


    loot();
    //if inventory is FULL //TODO CHECK PC 

}

// ============================================================================
// MOVE - Ziel suchen (einziger Schreiber von state.target) + bewegen
// ============================================================================
//targeting sollte iwie isoliert werden. 
//ziele sammeln.
function collectTargets() {
    //diese werte für config stellen
    state.targetQueue = Object.values(parent.entities);
    state.targetQueue = state.targetQueue.filter(e => e.type === "monster");
    state.targetQueue = state.targetQueue.filter(e => !e.dead);

}

function scoreTarget(monster) {
    //scoring system for targets. the higher the score the higher the priority.
    //ganze scoring system is unübersichtlich un buggy wir sollten das komplett überarbeiten.
    let score = 0
    if (monster.target === character.name) score += 1000000;
    //if (monster.target !== character.name&&!monster.target) score -= 1000000;
    if (monster.mtype === "frog" || monster.mtype === "osnake" || monster.mtype === "phoenix"|| monster.mtype === "mrpumpkin") score += 10000;
    if (monster.mtype === "fireroamer") score -= 1000000;
    if (monster.xp < 0) score -= 10000000;
    if (monster.name === "Target Automatron") score -= 10000000;
    score -= monster.level * 1000;

    if (!can_move_to(monster.x, monster.y)) score -= 10000;
    if (monster.attack >= derived.targetMaxAtk()) score -= 10000;
    //if(is_in_range(monster)) score +=100;
    if (monster.mtype === CONFIG.fight.targetFilter.type) score += 50000;
    score -= distance(monster, character);
    //if(monster.target !== character) score -= 100000;
    //game_log(monster.name + "/" + monster.mtype + " xp=" + monster.xp + " score=" + Math.round(score) + " dist=" + Math.round(monster.c_dist));
    return score;
}
function sortTargets() {
    state.priorTargets = state.targetQueue.map(monster => ({ monster, score: scoreTarget(monster) }))
        .sort((a, b) => b.score - a.score)
        .map(entry => entry.monster)
        .filter(monster => monster.xp >= 0)
        .filter(monster => monster.mtype !=="booboo" || monster.attack <280) //hotfix for booboo quest
        .filter(monster => monster.name !== "Target Automatron")
        .filter(monster => !CONFIG.fight.monsterBlacklist.includes(monster.mtype))
        .filter(monster => !monster.target || monster.target === character.name);//soll die filter die nicht auf mich zielen
        if (state.finishFight){
            state.priorTargets= state.priorTargets.filter(monster=>!monster.target || monster.target === character.name)
        };
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
    //if (state.finishFight) return // this is for wait_for_nice_health
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
//runLoop("visit", CONFIG.delay.visit, visitTick); dead
runLoop("potion", CONFIG.delay.potion, potionTick);runLoop("jobs", CONFIG.delay.jobs, pickJob);
game_log("finished", "#048627");

//JOBS
async function deathJob() {
    setMode("dead")
    state.target = null;
    state.aggroedOnMe = null;
    change_target(undefined);
    use_skill("stop")
    try { await handleDeath(); }   // saves pos, and walks back
    finally { setMode("farm") }
    return;
}

async function PotionJob() {
    if (state.mode === "farm") {
        setMode("restock")
        await restockPotion1(CONFIG.potions.restockAmount)
            .catch(function (e) { game_log("restock failed: " + (e.reason || e.message || e), "#ff0000"); })
            .finally(function () { setMode("farm") });
    }
}
/* async function StopJob(){
    
} */

async function InventoryJob() {
    if (state.mode === "farm") {

        if (!hasComputer()) { setMode("deploy") }
        //let latestSpot = safePos()
        try { let done = await sellShitDirty() } catch (e) { game_log("dumping stuff failed: " + (e.reason || e.message || e), "#ff0000"); }

        try { await doUpgradeRoutine() } catch (e) { game_log("upgrading stuff failed: " + (e.reason || e.message || e), "#ff0000"); }

        try { await combineWholeInventory() } catch (e) { game_log("combining stuff failed: " + (e.reason || e.message || e), "#ff0000"); }
        finally {
            if (state.mode === "deploy") {
                setMode("farm")
                //smart_move(latestSpot);
            }
        };

    }
}

function isFoo() {
    if (character.map === "main" && !is_moving(character)) return true
}
