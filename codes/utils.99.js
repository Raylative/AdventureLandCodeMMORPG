// @ts-nocheck

function msToMinutesString(ms) {
    return (Math.floor(ms / 60000) + " min")
}

function getMerchantForItem(itemName) {
    for (let npcKey in G.npcs) {
        let npc = G.npcs[npcKey];
        if (!npc.items) { continue; }
        if (npc.items.indexOf(itemName) !== -1) {
            return find_npc(npcKey);
        }
    }
    game_log("Kein Händler gefunden für: " + itemName, '#FF0000');
    return null;
}
async function goBuyAmount(itemName, quantity) {


    let merchantLocation = getMerchantForItem(itemName)


    if (!hasComputer()) { await smart_move(merchantLocation); }
    await buy_with_gold(itemName, quantity)
}

function safePos() {
    let safedPos = { x: character.x, y: character.y, map: character.map }
    return safedPos;
}
//show_json(getMerchantForItem("coat"))

function findFirstFilledInventory() {
    for (let itemSlot in character.items) {
        if (character.items[itemSlot] !== null) {
            return itemSlot
        }
    }
}
function hasComputer() {

    let computerInventorySpot = locate_item("supercomputer")
    if (computerInventorySpot === -1) return false
    else return true;
}
//TODO return true or false if it worked or nots
async function interactMonsterhunt() {

    if (state.mode === "farm") {
        game_log("checking Monsterhunt status")

        //IF NO QUEST GET ONE 
        if (!character.s.monsterhunt) {
            game_log("no monsterhunt, getting quest now")
            try { setMode("getting quest") } catch (e) { game_log(e.message || e.reason) }


            try {
                game_log("moving to Daisy")
                await smart_blink("home");
                game_log("asking for quest")
                status = await interact("monsterhunt");
                game_log("quest obtained!")
            }
            catch (error) { game_log(error.log || error.message || error.data) }

            finally { try { setMode("farm") } catch (e) { game_log(e.message || e.reason) } }
        }

        //IF QUEST EXISTS
        else if (character.s.monsterhunt.c === 0) {
            try { setMode("completing quest") } catch (e) { game_log(e.message || e.reason) }
            game_log("quest complete!")

            try {
                game_log("going to daisy")
                await smart_blink("home");
                game_log("telling daisy how sick of a monsterhunter i am, maybeshe'll mary me someday")
                status = await interact("monsterhunt");
                game_log("finished Monsterhunt! lets get a new one")
                if (!character.s.monsterhunt) await interact("monsterhunt");
                game_log("got a new quest :" + character.s.monsterhunt.id + character.s.monsterhunt.c)


            }
            catch (error) { game_log(error.reason || error.message || error.data) }

            finally { try { setMode("farm") } catch (e) { game_log(e.message || e.reason) } }
        }

    }
    game_log("something failed while checking for daisy")
    return;
}
function setMode(mode) {
    if (state.mode !== mode) state.mode = mode
    else throw new Error("error: tried setting mode to already existing one.")
    set_message(mode);
}

function isAppropiateHunt() {
    let monsterHuntQuest = character.s.monsterhunt.id;
    //TODO EVALUATE ITBETTER THEN A FUCKING WHITELIST, OOF!
    return (CONFIG.fight.monsterWhitelist.includes(monsterHuntQuest))



}

async function monsterQuestRoutine() {
    //this not really used right now. why did i do this.
    //check if one is going on 
    //if not get one 
    game_log("monsterhunt ongoing.")
    game_log("checking if it's doable.", "#d1c368")
    if (isAppropiateHunt()) {
        state.stand = false;

        game_log("doable.setting priority.")
        setTargetPriority(character.s.monsterhunt.id);
        game_log("locating nearest Monster.")
        //if monster in sight return. 
        if (can_move_to(get_nearest_monster({ type: character.s.monsterhunt.id })) && get_nearest_monster({ type: character.s.monsterhunt.id })) {
            game_log("enjoy hunting!", "#00ff55");

            return;
        }
        /*
        try {
        let teleAnchor = getMonsterSpawn(character.map, character.s.monsterhunt.id);
        if (get_nearest_monster({ teleAnchor })) await use_skill("blink", teleAnchor)
         } catch (e) { game_log("nice try fucker") } 
        */
        try {


            if (state.mode === "farm") {
                setMode("travel")
            }
            game_log("Monster not in " + character.map)

            await smart_blink(character.s.monsterhunt.id);
        } catch (e) { game_log(e.reason) }
        finally { if (state.mode === "travel") setMode("farm"); }
    }
    // UNTIDY SPECIAL LOGIC FOR BOOBOO REFACTORING NEEDED-> strategy for each difficult mob. (its good cheese though)
    else if (character.s.monsterhunt.id === "booboo") {
        state.stand = true
        await smart_blink({ map: "spookytown", x: 180, y: -662 });
        if (isAtPlace("spookytown",180,-662,200)) {
            CONFIG.fight.targetFilter = { type: character.s.monsterhunt.id, max_att: 265 };
            game_log("enjoy hunting!", "#00ff55");

            return;
        }
        try {
            if (state.mode === "farm") {
                setMode("travel")
            }
            game_log("Monster not in " + character.map)

            await smart_move({ x: 180, y: -662, map: "spookytown" })
        } catch (e) { game_log(e.reason) }
        finally {
            if (state.mode === "travel") {

                setMode("farm")

            };
        }
    }
}

function setTargetPriority(targetPriority) {
    if (CONFIG.fight.targetFilter.type !== targetPriority)
        CONFIG.fight.targetFilter.type = targetPriority;
}

function getMonsterSpawn(map, monster) {
    if (G.maps[map].monsters) {

        for (let box of G.maps[character.map].monsters) {
            if (box.type === monster)
                return [box.boundary[0], box.boundary[1]];
        }
    }


}

async function fastBlinkToBooBoo() {
    /*     let places = {
           "main": [1943, 32],
           "level1": [-313, 544],
           "spookytown": [180, -662]
        } */

    if (character.map === "main"/* &&!can_move_to({x:1943,y:32}) */) {
        await wait_for(() => can_use("blink") && G.skills.blink.mp < character.mp);

        await use_skill('blink', [1943, 32]);
        await wait_for(() => character.s.blink);
        await wait_for(() => !character.s.blink);
    }
    if (character.map === "level1"/* &&!can_move_to({x:-313,y:544}) */) {
        await wait_for(() => can_use("blink") && G.skills.blink.mp < character.mp);
        await use_skill('blink', [-313, 544]);
        await wait_for(() => character.s.blink);
        await wait_for(() => !character.s.blink);
    }
    //if (character.map === "spookytown"/* &&!can_move_to({x:180,y:-662}) */) await use_skill('blink', [180, -662]);
}



async function pickJob() {


    for (let Job of JOBS) {
        if (Job.when()) {
            if (isCharacterTargeted()) {
                state.finishFight = true;
                return
            }
            if (state.finishFight = true) state.finishFight = false;


            await Job.do();
            return
        }
    }
}
async function pickAndVisitEvent() {
    for (let event of EVENTS) {
        if (event.when()) {
            await event.do();
            return;
        }
    }
}

function shouldVisitDaisy() {
    return character.s.monsterhunt?.c === 0 || !character.s.monsterhunt
}

function isHuntDoable() {
    return isAppropiateHunt() || character.s.monsterhunt.id === "booboo"
}

async function fooshit() {
    if (state.mode === "farm") setMode("idlefarm")
    try { await smart_blink(CONFIG.fooshitmonster) } catch (e) { game_log(e.reason) } finally { if (state.mode === "idlefarm") { setMode("farm") } }
};

function isCharacterTargeted() {

    if (get_nearest_monster({ target: character })) return true;
    else return false;
}

/**
 * Finds the route with the fewest doors between two maps (BFS over G.maps doors).
 * @param {string} MapStart - map key to start from, e.g. "main"
 * @param {string} MapDestination - map key to reach, e.g. "spookytown"   
 * @returns {string[]} order of os maps you want to go next. with destination at last spot.
 */
function findPathwithleastAmmountOfDoors(MapStart, MapDestination) {
    //BFS stuff: first Make a queue
    let MapQueue = [MapStart];
    //note down where the world and whe i reached it from
    let visited = {};
    //first one has no root
    visited[MapStart] = null;
    //while the queue is filled
    while (MapQueue.length > 0) {
        //set current map to next in queue
        let currentMap = MapQueue.shift()
        if (currentMap === MapDestination) break;



        //scan through each door - put in list
        // WENN ALIA IN CURRENT MAP DANN MIT IIN LISTE 
        //dann erst durch neue liste scannen

        // SOLL STATT DURCH DOORS DURCH EINE LISTE DIE ALIA MITEINBEZIEHT. 
        let possibleNextDestinations = collectAllTravelGoals(currentMap);
        for (let nextDestination of possibleNextDestinations) {

            //this index is its destination

            //dont put already visited in the list
            if (nextDestination in visited) continue;
            //note down the maps connection 
            visited[nextDestination] = currentMap;
            //push the doors destination as a map to search through too.
            MapQueue.push(nextDestination)

        }
    }
    if (!(MapDestination in visited)) {
        throw new Error("no path was found. check names");
    }
    //now we gotta reconstruct the way 
    //first look up the destination Map in visited 
    let MapPath = []
    let currentMapNode = MapDestination
    while (visited[currentMapNode] !== null) {
        MapPath.unshift(currentMapNode)
        currentMapNode = visited[currentMapNode];
    }
    return MapPath;

    show_json(G.maps[character.map].doors) //usefull copypaste
}
/**
 * returns a door's x and y as array leading to wanted destination
 * @param {string} MapDestination - map key to reach, e.g. "spookytown"   
 * @param {string} Map start point (most cases just character.map)
 * @returns {number[]} x and y position of the door or null
 */
function getDoorLocation(Map, MapDestination) {
    for (let door of G.maps[Map].doors) {
        //check if door leads to Mapdestination
        if (door[4] === MapDestination) {
            let doorSpawn = door[6];
            let SpawnX = G.maps[Map].spawns[doorSpawn][0];
            let SpawnY = G.maps[Map].spawns[doorSpawn][1];
            return [SpawnX, SpawnY]
        };
    }
    return null;
}



function hasTransporter(MapToCheck) {

    for (let npc of G.maps[MapToCheck].npcs) {
        if (npc.id === "transporter") return true
    }
    return false;


}

function getDoorArray(Map) {
    if (!G.maps[Map]) throw new Error("this Map/World doesnt exist!");
    //returns the places of the doors in given map
    let array = [];
    for (let door of G.maps[Map].doors) {
        if (array.includes(door[4])) continue;
        array.push(door[4])
    }
    return array;
}

function getTransporterArray() {
    //empty array:
    let array = [];
    for (let place in G.npcs.transporter.places) {
        array.push(place);
    }
    return array;
}

function combineArrays(array1, array2) {
    let combined = [];
    combined = combined.concat(array1).concat(array2);
    return combined;
}
function collectAllTravelGoals(Map) {
    //first collect all doors in map
    let travelGoals = getDoorArray(Map);
    //check if alia is there(transporter) if yes get arrays and combine 
    if (hasTransporter(Map)) travelGoals = combineArrays(travelGoals, getTransporterArray())
    return travelGoals;
}

function getTravelStep(Start, Destination) {
    // first check if you can reach this spot via transporter
    let travelStep = { x: null, y: null, node: null }
    let doorCoordinates = getDoorLocation(Start, Destination)
    if (hasTransporter(Start) && Destination in G.npcs.transporter.places) {
        [travelStep.x, travelStep.y] = getTransporterLocation(Start)
        travelStep.node = G.npcs.transporter.places[Destination];
        return travelStep;
    }
    else if (doorCoordinates !== null) {
        [travelStep.x, travelStep.y] = doorCoordinates;
        travelStep.node = getDoorNode(Start, Destination)
        return travelStep;
    }
    return null;
}
function getTransporterLocation(map) {
    if (map === "halloween") return G.maps.halloween.spawns[1]; // i need this refference shit bullshiit because its the fucking only one that cant be refferenced from alia wtf is this bs
    if (!G.maps[map]) throw new Error("this Map/World doesnt exist!");

    let spawnPoint = G.npcs.transporter.places[map];
    let spawnPointInfo = G.maps[map].spawns[spawnPoint];
    let coordinates = [spawnPointInfo[0], spawnPointInfo[1]]
    return coordinates

}

function getDoorNode(Map, MapDestination) {
    for (let door of G.maps[Map].doors) {
        //check if door leads to Mapdestination
        if (door[4] === MapDestination) return door[5];
    }
    return null;
}

async function fastBlinkToLocation(LocationDestination, finalX = undefined, finalY = undefined) {
    let route = []
    try {
        if(isAtPlace(LocationDestination,finalX,finalY,100)) return; // could cause bugs... not handling undefined..
        await wait_for(() => can_use("blink") && character.mp > character.max_mp / 2, 20000);
        route = route.concat(findPathwithleastAmmountOfDoors(character.map, LocationDestination))
        game_log("traveling to " + LocationDestination)
        for (let i in route) {
            while (character.map !== route[i]) {
                let travelStep = getTravelStep(character.map, route[i]);
                await wait_for(() => can_use("blink") && G.skills.blink.mp < character.mp);
                await use_skill("blink", [travelStep.x, travelStep.y]);
                await wait_for(() => character.s.blink);
                await wait_for(() => !character.s.blink);
                await transport(route[i], travelStep.node);
            }
        }
        if (finalX !== undefined && finalY !== undefined) {
            await wait_for(() => can_use("blink") && G.skills.blink.mp < character.mp);
            await use_skill("blink", [finalX, finalY]);
            await wait_for(() => character.s.blink);
            await wait_for(() => !character.s.blink);
        }
    } catch (e) { game_log(e.reason || e.message) }
    game_log("done, appearingly")
}
function isAtPlace(map, x, y, tolerance) {
    if (character.map !== map) return false
    let isInX = character.x >= x - tolerance && character.x <= x + tolerance
    let isInY = character.y >= y - tolerance && character.y <= y + tolerance
    if (isInX && isInY) return true
    else return false

}



async function wait_for_nice_health() {
    if (state.mode === "farm") setMode("regenerate")
    try { await wait_for(() => (character.hp > ((character.max_hp / 3) * 2)), 30000) }
    catch (e) {
        game_log("regenerate:" + (e.reason || e.message))
    }
    finally {
        if (state.mode === "regenerate") setMode("farm")
    }
}

function pickRandomEntry(givenArray) {
    //returns content of a random index in this array.
    let length = givenArray.length;
    let randomIndex = Math.floor(Math.random() * length);

    return givenArray[randomIndex]
}
function findMonsterSpawn(wantedType) {
    let allMonsterSpawns = [];
    let boundaries = [];

    for (let map in G.maps) {
        if (G.maps[map].ignore) continue;
        if (!G.maps[map].monsters) continue;
        for (let monster of G.maps[map].monsters) {
            if (monster.type !== wantedType) continue;
            //boundaries = boundaries.concat(monster.boundaries)

            boundaries = monster.boundaries ?? [[map, ...monster.boundary]]
            for (let boundary of boundaries) {
                let assignedMap = boundary[0]// map
                let x1 = boundary[1] //x1
                let y1 = boundary[2] //y1 makes the first corner
                let x2 = boundary[3]
                let y2 = boundary[4] //second corner
                let x = (x1 + x2) / 2
                let y = (y1 + y2) / 2 //calculates the middle
                let MonsterSpawn = { map: assignedMap, x: x, y: y }
                allMonsterSpawns = allMonsterSpawns.concat(MonsterSpawn);
            }
        }

    }
    if (allMonsterSpawns.length === 0) {
        game_log("FindMonsterspawn: no spawn found");
        return;
    }



    return pickRandomEntry(allMonsterSpawns)
}

async function smart_blink(smartArgument) {
    if (is_string(smartArgument)) {
        if (smartArgument === "home") return await fastBlinkToLocation("main", -60, -287)
        let monsterSpawn = findMonsterSpawn(smartArgument);
        if (!monsterSpawn) return;
        return await fastBlinkToLocation(monsterSpawn.map, monsterSpawn.x, monsterSpawn.y)
    }
    if ("x" in smartArgument
        && "y" in smartArgument
        && "map" in smartArgument) return await fastBlinkToLocation(smartArgument.map, smartArgument.x, smartArgument.y)

    //only works for monster rn

}

