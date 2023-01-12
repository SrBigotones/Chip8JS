
var vRAM = new Array(4096)
var vVX = new Array(16) //V0 to VF general registers
var vPC = vI = vTIMER = vSOUND = 0
var oX = new Array(64).fill(0)
var oY = new Array(32).fill(0)

var vSTACK = new Array()

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

function fetch(){
    let actualOP = 0
    actualOP = (vRAM[startRAM + vPC] << 8) + (vRAM[startRAM + vPC+1]) //Big Endian
    vPC += 2
    return actualOP
}

function decode(opCODE){
    let nibble = [(opCODE & 0x0F00) >> 8,(opCODE & 0x00F0) >> 4,(opCODE & 0x000F)]
    console.log(`opCODE: ${opCODE.toString(16)}`)
	//console.log(`logic: ${(op)}`)
	switch (true) {
        case opCODE == 0x00e0: // clear screen
            ctx.clearRect(0,0, canvas.width, canvas.height)
            oX = new Array(64).fill(0)
            oY = new Array(32).fill(0)
            break;

        case (opCODE & 0xF000) == 0x1000: //1NNN Jump
            vPC = opCODE & 0x0fff
            break;

        case (opCODE & 0xF000) == 0x2000://2NNN Jump set stack
            vSTACK.push(vPC)
            vPC = opCODE & 0x0fff
            break;

        case opCODE == 0x00ee://00ee Return
            vPC = vSTACK.pop()
            break;

        case (opCODE & 0xF000) == 0x6000://6XNN set register VX
            vVX[nibble[0]] = (nibble[1] << 4) + nibble[2]
            break;

        case (opCODE & 0xF000) == 0x7000://7XNN add value to register VX
            console.log(vVX[nibble[0]])
			vVX[nibble[0]] += (nibble[1] << 4) + nibble[2]  
            console.log(vVX[nibble[0]])
			break;

        case (opCODE & 0xF000) == 0xA000://ANNN set index register I
            vI = opCODE & 0xFFF
            break;

        case (opCODE & 0xF000) == 0xD000://DXYN display/draw
            let x = vVX[nibble[0]] 
            let y = vVX[nibble[1]]
            let pixelLine = 0
            vVX[0xF] = 0 //VF
            console.log(`vI: ${vI}`) 
            for (let h = 0; h < nibble[2]; h++) {
                pixelLine = vRAM[vI + h]
                //console.log(`pL: ${pixelLine.toString(2)}`)
				for (let j = 0; j <= 8; j++) {
                    //console.log(pixelLine & (1 << j))
					if((pixelLine & (0x80 >> j)) != 0){
                        if(oX[x+j] == 1 & oY[y+h] == 1){
                            drawPixel(x+j, y+h, 1)
                            vVX[0xf] = 1
                        }else{
                            drawPixel(x+j, y+h, 1)
                        }
                    }
                    if(x+j > 63){
                        break
                    }
                }
                if(y+h > 31){
                    break
                }
            }
            
            break;
		case ((opCODE & 0xf000) == 0xd000):
			console.log("shit for brains")
        default:
            break;
    }
}


function loadPG(){
    //Load program to RAM
    let h = 0
    fs.open('./programs/ibmLogo.ch8', 'r', function(err, fd) {
    if (err)
        throw err;
    var buffer = Buffer.alloc(1);
    while (true)
    {   
        var num = fs.readSync(fd, buffer, 0, 1, null);
        if (num === 0)
        break;
        vRAM[startRAM + h]
        h += 1
        //console.log('byte read', buffer[0].toString(16));
    }
    });
}



function openfile() {
	var input = document.getElementById("inputROM").files;
	var fileData = new Blob([input[0]]);

	var reader = new FileReader();
	reader.readAsArrayBuffer(fileData);
	reader.onload = function(){
		var arrayBuffer = reader.result
		var bytes = new Uint8Array(arrayBuffer);
		console.log(bytes);
		console.log(bytes.length)
		for(var i = 0; i < bytes.length; i++){
			console.log("caca")
			vRAM[startRAM + i] = bytes[i]
		}
		startME()
	}
}

function drawPixel(x, y, c){
	//console.log(`draw ${x} ${y} ${c}`)
    ctx.beginPath();
    ctx.rect(x*10, y*10, 10, 10);
    if(c == 1){
        //draw
        ctx.fillStyle = `white`;//`rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
        oX[x] = oY[y] = 1
    }else{
        //clean per se
        ctx.fillStyle = `black`;//`rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
        oX[x] = oY[y] = 0
    }
    ctx.fill();
    ctx.closePath();    
}

writeFonts(0x50)

//loadPG()


function startME(){
	for(var i=0; i < 50; i++){
		decode(fetch())
		console.log(`instruction: ${i}`)
	}

}




