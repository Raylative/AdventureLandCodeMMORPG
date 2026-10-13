//does some visualization of the char. its very basic
// @ts-nocheck
function on_draw() {
    clear_drawings();
    //char range
    draw_circle(character.x, character.y, character.range, 2, 0x048627);
    //kite boarder
    draw_circle(character.x, character.y, derived.kiteMax(), 2, 0xfb9904);

    if (state.posNext) {
        draw_line(character.x, character.y, state.posNext.x, state.posNext.y, 2, 0xff8800);
    }

    const t = state.target;
    if (t && !t.dead && !character.rip) {
        draw_circle(t.x, t.y, t.range, 2, 0xba1414);
        draw_circle(character.x, character.y, derived.keepDistance(t), 2, 0xba1414);
    }

    const a = state.aggroedOnMe;
    if (a && !a.dead) {
        draw_circle(a.x, a.y, a.range, 2, 0xba1414);
    }
    //drawHealthFace();
}
