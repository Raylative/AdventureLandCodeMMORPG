// @ts-nocheck
var strafeDirection = 1;

function decideMovement(target) {
    //game_log(target);
    let positionDecision = { x: character.x, y: character.y }; //x,y
    if (target===undefined) return ; // gibt testweise undefined zurück anstatt die gleiche pos.
    let distanceToEnemy = distance(character, target)

    if(state.stand) return ;

    let dx = (target.x - character.x);
    let dy = (target.y - character.y);

    // How to fix that properly... ? 
    //make a circle around character. 
    //maybe there is one already? 
    //chose a random opoint on the circle
    //go there
    if(distanceToEnemy ===0 ){
        dx = Math.random();
        dy = Math.random();
        distanceToEnemy = (1+Math.random());
        //game_log("hotfix executed")
    }
    clear_drawings();
    
    

    let dirX = dx / distanceToEnemy;
    let dirY = dy / distanceToEnemy
    //if distance is zero this ends up in 0/0 which is not good. i figured.
    let stepSize = 20; //find better 


    let minDistance = Math.min(target.range +CONFIG.move.targetRangePadding,character.range - CONFIG.move.ownRangeMargin);// make sure bitch cant attack me
    let maxDistance = character.range * CONFIG.move.kiteBandFactor;

    let inRange = is_in_range(target); //standart attack

    if (!inRange) {

        positionDecision = {
            x: character.x + (dirX * stepSize),
            y: character.y + (dirY * stepSize)
        };

    }
    else if (distanceToEnemy <= minDistance) {
        positionDecision = {
            x: character.x - (dirX * stepSize),
            y: character.y - (dirY * stepSize)
        };
    }
    else if (distanceToEnemy < maxDistance && distanceToEnemy > minDistance) {
        positionDecision = {
            x: character.x - (dirY * stepSize * strafeDirection),
            y: character.y + (dirX * stepSize * strafeDirection)
        };
    }
    if (!can_move_to(positionDecision.x, positionDecision.y)) {
        //game_log("turning around");
        strafeDirection *= -1;
        positionDecision = {
            x: character.x - (dirY * stepSize * strafeDirection),
            y: character.y + (dirX * stepSize * strafeDirection)
        };
    }
    //game_log(strafeDirection);
    //game_log((can_move_to(positionDecision.x, positionDecision.y)));
    //game_log("x: " + (Math.round(positionDecision.x)));
    //game_log("y: " + (Math.round(positionDecision.y)));
    //if (stand) positionDecision = { x: character.x, y: character.y }
    return positionDecision;
} 
/* function on_draw() {

    draw_circle(character.x, character.y, minDistance, 2, 0xff00ff);
} */
