//BIG REFACTORING TIME OH BOI!!!!
// @ts-nocheck
/* LOAD CODE */
try { load_code("buyPotions"); } catch (e) { game_log("missing code: buyPotions", "#ff0000"); }
try { load_code("move"); } catch (e) { game_log("missing code: move", "#ff0000"); }
try { load_code("attackMage"); } catch (e) { game_log("missing code: attackMage", "#ff0000"); }
try { load_code("handleDeath"); } catch (e) { game_log("missing code: handleDeath", "#ff0000"); }

const CONFIG = {
    delay: {
        main: 100,
        fight: 50,
        skill: 50,
        move: 100
    },
    fight: {
        maxAttackHpDivisor: 5,
        attackRange: 50,
        targetFilter:
        {
            no_target: true,
            type: "goo"
        },
    },

    move: {
        stepSize: 12,
        targetRangePadding: 30,
        ownRangeMargin: 10,
        kiteBandFactor: 0.5
    },

    potions: {
        manaUseFraction: 0.7,
        restockBelow: 100,
        restockAmount: 9900
    },
};
const state = {
    mode: "farm",
    target: null,
    aggroedOnMe: null,
    targetAttacking: false,
    posNext: null,
    //strafeDirection: CONFIG.combat.
}
const STATIC = {
    hpotHeal: G.items.hpot1.gives[0][1],
}

const derived = {
    hpUseBelow:   () => character.max_hp - STATIC.hpotHeal,
    mpUseBelow:   () => character.max_mp * CONFIG.potions.manaUseFraction,
    targetMaxAtk: () => character.hp / CONFIG.fight.maxAttackHpDivisor,
};

/* VARIABLES */ // TODO RENAME
//potion:
var shouldBuyPotions = true;
var posNext = {};
//let oldTarget = undefined;
/* var targetisTargeting = undefined; */
var aggroedOnMe = undefined;
/* var gettingExpFromFight = true; */

/* var shouldLookForTarget = true; */

/* FLAGS */ // TODO RENAME

var mode_restock = false;

/* MAIN INTERVAL */
async function main() {
    while (true) {
        /* handle death */
        if (character.rip) {
            target = undefined;
            await handleDeath();
            change_target(undefined);
            continue;
        }
        /* handle Inventory */
        // read Potion Stock
        try { ({ shouldBuyPotions,  } = checkPotionStock()); } catch (e) { game_log("fuck,something wrong in 'checkPotionStock()'") };

        //if low Count go Set flag to restock and go buy!.
        if (!mode_restock && shouldBuyPotions) {
            mode_restock = true;
            set_message("buying potions");
            restockPotion1(numRestockPotion).finally(function () {
                mode_restock = false;
            });
        }

        /* handle PotionConsumption */
        if (character.hp < derived.hpUseBelow() || character.mp < derived.mpUseBelow()) {
            use_hp_or_mp();
        }

        /* loot  */
        loot();


        await new Promise((r) => setTimeout(r, CONFIG.delay.main));

    }
}

function on_draw() {
    clear_drawings();
    draw_circle(character.x, character.y, character.range, 2, 0x048627);
    draw_line(character.x, character.y, posNext.x, posNext.y, 2, 0xff8800);
    if (get_target_of(character)) {
        if (!target.rip)
            draw_circle(target.x, target.y, target.range, 2, 0xba1414)
    }
    if (aggroedOnMe)
        draw_circle(aggroedOnMe.x, aggroedOnMe.y, aggroedOnMe.range, 2, 0xba1414)
    draw_circle(character.x, character.y, Math.min(target.range + 30, character.range - 10), 2, 0xba1414)
    draw_circle(character.x, character.y, character.range * 0.5, 2, 0xfb9904)
}

character.on("level_up", async function (data) {
    game_log("noticed level up");
    if (data.damage > 0) {
        let idx = locate_item("partypopper");
        if (idx === -1) return;
        if (idx !== -1) {
            for (let i = 0; i < 10; i++) {
                try {
                    await throw_item(idx, character.x, character.y + 10);
                } catch (e) {
                    game_log("partypopper failed: " + e);

                } finally {
                    await new Promise((r) => setTimeout(r, 500));
                }

            }
        }
    }
});
// ERSTE AUFGABE: MOVEMENT LOOP ISOLIEREN UND FIGHT LOOP!!!!!!!

//FIGHT
async function fightLoop() {
    while (true) {
        if (can_attack(target) && character.mp >= character.mp_cost) {
            set_message("Attacking");
            try { await attack(target); } catch (e) { game_log("attack failed: " + e.reason) }
        }
        await new Promise((r) => setTimeout(r, CONFIG.delay.fight))
    }

}
async function skillLoop() {
    while (true) {
        await useSkillSet(target);
        await new Promise((r) => setTimeout(r, CONFIG.delay.skill));
    }
}

async function moveLoop() {
    while (true) {
        aquireTarget()
        posNext = decideMovement(target);
        move(posNext.x, posNext.y);
        await new Promise((r) => setTimeout(r, CONFIG.delay.move));
    }
}

function aquireTarget() {
    target = get_targeted_monster();
    targetisTargeting = get_target_of(target);
    gettingExpFromFight = targetisTargeting === character;

    shouldLookForTarget = !target || !gettingExpFromFight;

    if (shouldLookForTarget) {
        //check for aggro
        aggroedOnMe = get_nearest_monster({ max_att: derived.targetMaxAtk(), target: character })
        if (aggroedOnMe) target = aggroedOnMe;
        else target = get_nearest_monster(CONFIG.fight.targetFilter);

        if (target) {
            change_target(target);


        }
        else {
            set_message("No Monsters");
            //if (oldTarget)await smart_move(oldTarget.mtype);
            //target = get_nearest_monster(wantedTarget);
            return;
        }
    }
}

// START LOOPS:

main();
fightLoop();
moveLoop();
skillLoop();
game_log("finished", '#048627');

// Learn Javascript: https://www.codecademy.com/learn/introduction-to-javascript
// Write your own CODE: https://github.com/kaansoral/adventureland_mongodb/blob/main/js/runner_functions.js
// NOTE: If the tab isn't focused, browsers slow down the game
// NOTE: Use the performance_trick() function as a workaround
//await new Promise((r) => setTimeout(r, 100));



//e.reason for logging the catch reason

// nützliches 
//const allBosses = ['bgoo', 'crabxx', 'dragold', 'franky', 'greenjr', 'grinch', 'icegolem', 'jr', 'mrgreen', 'mrpumpkin', 'phoenix', 'rgoo', 'wabbit'];
