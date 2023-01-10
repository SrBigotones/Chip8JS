var vRAM = new Array(4096)
var vREG = new Array(16) //V0 to VF general registers
var vPC, vI, vSTACK, vTIMER, vSOUND

const startRAM = 512 //Where I start to write to RAM
const vFONTS = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80 ] // F


function writeFonts(start){
    //Write Fonts to memory
    for (let i = 0; i < vFONTS.length; i++) {
        vRAM[i+start] = vFONTS[i];
    }
}

function fetch(){}
function decode(opCODE){
    switch (opCODE) {
        case 0x00e0: // clear screen
            break;
        case (opCODE & 0xF000) == 0x1000: //1NNN Jump
            break;
        case (opCODE & 0xF000) == 0x6000://6XNN set register VX
            break;
        case (opCODE & 0xF000) == 0x7000://7XNN add value to register VX
            break;
        case (opCODE & 0xF000) == 0xA000://ANNN set index register I
            break;
        case (opCODE & 0xF000) == 0xD000://DXYN display/draw
            break;
        default:
            break;
    }
}

function drawPixel(x, y){
    ctx.beginPath();
    ctx.rect(x, y, 10, 10);
    ctx.fillStyle = `white`;//`rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
    ctx.fill();
    ctx.closePath();    
}


writeFonts(0x90)

console.log(vRAM[0])