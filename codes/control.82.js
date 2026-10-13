//just some control stuff
function toggleStand(){
if (state.stand)state.stand=false;
else state.stand = true;
}

//instand register the command

map_key("4","snippet","toggleStand()");
