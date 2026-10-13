

async function handleDeath (){
    //save Pos
let PosDeath = {x:character.x, y:character.y,map: character.map};
await new Promise((r) => setTimeout(r, 20000)); //wait 30 seconds to reflect on life man . . . .
await respawn();
await smart_move(PosDeath); //and come back. "IM NOT DONE YET, FUCKER!!!"
//should be back at death position
}
