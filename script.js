
var vRAM = new Array(4096)
var vVX = new Array(16).fill(0) //V0 to VF general registers
var vI = vTIMER = vSOUND = 0
var oX = new Array(64).fill(0)
var oY = new Array(32).fill(0)
var pKey = 0xff //pressed key
const altShift = 0 //alternative shift operator, 0 = original, VX = VY and then shift // 1 = 90', VX shifts
const cpuWait = 8
var runI = getOP = 0
var vSTACK = new Array()
var pgSize
var selKey = 0xff
var keys = new Array(0xf).fill(false)
const opTable = document.getElementById("opTable")
const startRAM = 512 //Where I start to write to RAM
var vPC = startRAM
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
    actualOP = (vRAM[vPC] << 8) + (vRAM[vPC+1]) //Big Endian
    vPC += 2
    return actualOP
}


function writeDivOP(opCODE){
    
    // Insert a row at the end of table
    var newRow = opTable.insertRow();

    // Insert a cell at the end of the row
    var newCell = newRow.insertCell();

    // Append a text node to the cell
    var newText = document.createTextNode(`${opCODE.toString(16)}`);
    newCell.appendChild(newText);
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

        case (opCODE & 0xF000) == 0x3000://3XNN SKIP
            if(vVX[nibble[0]] == (opCODE & 0xff)){
                vPC += 2
            }
        break;
        
        case (opCODE & 0xF000) == 0x4000://4XNN SKIP
            if(vVX[nibble[0]] != (opCODE & 0xff)){
                vPC += 2
            }
        break;

        case (opCODE & 0xF000) == 0x5000://5XY0 SKIP
            if(vVX[nibble[0]] == vVX[nibble[1]]){
                vPC += 2
            }
        break;

        case (opCODE & 0xF000) == 0x9000://9XY0 SKIP
            if(vVX[nibble[0]] != vVX[nibble[1]]){
                vPC += 2
            }
        break;
        

        case (opCODE & 0xF000) == 0x6000://6XNN set register VX
            vVX[nibble[0]] = (nibble[1] << 4) + nibble[2]
            break;

        case (opCODE & 0xF000) == 0x7000://7XNN add value to register VX
            console.log(vVX[nibble[0]])
			vVX[nibble[0]] += (nibble[1] << 4) + nibble[2]  
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff //Caution of overflow
            console.log(vVX[nibble[0]])
			break;

        case (opCODE & 0xF00F) == 0x8000: //8XY0 SET
            vVX[nibble[0]] = vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8001: //8XY1 OR
            vVX[nibble[0]] = vVX[nibble[0]] | vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8002: //8XY2 AND
            vVX[nibble[0]] = vVX[nibble[0]] & vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8001: //8XY3 XOR
            vVX[nibble[0]] = vVX[nibble[0]] ^ vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8004: //8XY4 ADD
            vVX[nibble[0]] = vVX[nibble[0]] + vVX[nibble[1]]
            
            if (vVX[0] > 0xff){ //Check if overflow
                vVX[0] = vVX[0] & 0xFF
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }

            break

        case (opCODE & 0xF00F) == 0x8005: // 8XY5 Substract
            if(vVX[0] > vVX[1]){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }

            vVX[nibble[0]] -= vVX[nibble[1]] 
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            break
        case (opCODE & 0xF00F) == 0x8005: // 8XY7 Substract
            if(vVX[1] > vVX[0]){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }

            vVX[nibble[0]] = vVX[nibble[1]] - vVX[nibble[0]]
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            break

        case (opCODE & 0xF00F) == 0x8006: //8XY6 SHIFT RIGHT
            if(altShift == 0){
                vVX[nibble[0]] = vVX[nibble[1]]
            }
            if((vVX[nibble[0]] & 0x01) == 1){
                vVX[0xf] = 1
            }else{vVX[0xf] = 0}
            vVX[nibble[0]] = vVX[nibble[0]] >> 1
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            break
        case (opCODE & 0xF00F) == 0x800E: //8XYE SHIFT LEFT
            if(altShift == 0){
                vVX[nibble[0]] = vVX[nibble[1]]
            }
            if((vVX[nibble[0]] & 0x80) == 1){
                vVX[0xf] = 1
            }else{vVX[0xf] = 0}
            vVX[nibble[0]] = vVX[nibble[0]] << 1
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            break

        case (opCODE & 0xF000) == 0xA000://ANNN set index register I
            vI = opCODE & 0xFFF
            break;
        
        case (opCODE & 0xF000) == 0xB000://BNNN Jump with offset
            vPC = ((opCODE & 0xfff) + vVX[0])
            break;

        case (opCODE & 0xF000) == 0xC000://CXNN Random
            vVX[nibble[0]] = Math.floor(Math.random() * 0xff) & (opCODE & 0xff)
            break;
        // #################KEYS#################
        case (opCODE & 0xF0FF) == 0xE09E: // EX9E Skip if key
            if(keys[nibble[0]] == true){
                vPC += 2
            }
            break
        case (opCODE & 0xF0FF) == 0xE0A1:// EXA1 Skip if key
            if(keys[nibble[0]] == false){
                vPC += 2
            }
            break
        
        //############TIMERS###############
        case (opCODE & 0xF0FF) == 0xF007:// FX07 Set VX to the current value of the delay timer
            vVX[nibble[0]] = vTIMER
            break
        case (opCODE & 0xF0FF) == 0xF015:// FX15 Sets the delay timer to the value in VX
            vTIMER = vVX[nibble[0]]
            break
        case (opCODE & 0xF0FF) == 0xF018:// FX18 sets the sound timer to the value in VX
            vSOUND = vVX[nibble[0]]
            break

        case (opCODE & 0xF0FF) == 0xF01E:// FX1E Add to index
            vI += vVX[nibble[0]]

            if(vI > 0xfff){ //Overlflow
                vI = vI & 0xfff
                vVX[0xf] = 1
            }
            break

        case (opCODE & 0xF0FF) == 0xF00A:// FX0A Get key
            var aux = keys.includes(true)

            if(aux){
                for (let i = 0; i < keys.length; i++) {
                    if(keys[i] == true){
                        vVX[nibble[0]] = aux
                        break
                    }
                }
            }else{
                vPC -= 2
            }
            break
        
        case (opCODE & 0xF0FF) == 0xF029:// FX29 Font Character
            //Fonts stored in 0x50, 5 bytes per character
            vI = 0x50 + (5 * vVX[nibble[0]])
            break
        
        case (opCODE & 0xF0FF) == 0xF033:// FX33 Binary-coded decimal conversion
            var foo = vVX[nibble[0]]

            vRAM[vI] = ~~(foo/100)
            vRAM[vI+1] = ~~((foo%100)/10)
            vRAM[vI+2] = ~~(((foo%100)%10))
            break
        
        case (opCODE & 0xF0FF) == 0xF055:// FX55 Store Memory
            for (let i = 0; i <= nibble[0]; i++) {
                vRAM[vI + i] = vVX[i]
            }
            break
        case (opCODE & 0xF0FF) == 0xF065:// FX65 Load Memory
            for (let i = 0; i <= nibble[0]; i++) {
                vVX[i] = vRAM[vI + i]
            }
            break

        case (opCODE & 0xF000) == 0xD000://DXYN display/draw
            let x = vVX[nibble[0]] 
            let y = vVX[nibble[1]]
            let pixelLine = 0
            vVX[0xF] = 0 //VF
            console.log(`vI: ${vI}`) 
            for (let h = 0; h < nibble[2]; h++) {
                pixelLine = vRAM[vI + h]
                //console.log(`pL: ${pixelLine.toString(2)}`)
				for (let j = 0; j < 8; j++) {
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
        default:
            break;
    }
}


function openfile() {
    opTable.innerHTML = `<tr>
                            <th>Instructions</th>
                        </tr>`
    vRAM = new Array(4096)
    VX = new Array(16).fill(0) //V0 to VF general registers
    vI = vTIMER = vSOUND = 0
    oX = new Array(64).fill(0)
    oY = new Array(32).fill(0)
    runI = getOP = 0
    vSTACK = new Array()
    pgSize = 0
    vPC = startRAM

	var input = document.getElementById("inputROM").files;
	var fileData = new Blob([input[0]]);
    let aux = new Array(2)

	var reader = new FileReader();
	reader.readAsArrayBuffer(fileData);
	reader.onload = function(){
		var arrayBuffer = reader.result
		var bytes = new Uint8Array(arrayBuffer);
        pgSize = bytes.length
		//console.log(bytes);
		//console.log(bytes.length)
		for(var i = 0; i < pgSize; i++){
			//console.log("caca")
			vRAM[startRAM + i] = bytes[i]
            //console.log(vRAM[startRAM+i].toString(16))
            if(i % 2 == 1){
                writeDivOP((bytes[i-1] << 8) + bytes[i])
            }
		}
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runOne(){
    //console.log(`I: ${runI}`)
    try {
        setTableInfo()
        
    } catch (error) {
        
    }
    await sleep(cpuWait)
    getOP = fetch()
    // decode(getOP)
    if(getOP){
        //console.log(opTable.rows[runI])
        decode(getOP)
    }else{
        return
    }
    
    //console.log(`instruction: ${runI}`)
    runI += 1

}





async function startME(){
    console.log("################START##############")
    console.log(vRAM[0x229])
    console.log("################START##############")
    while(vPC < pgSize + 512){
        try {
            setTableInfo()
            
        } catch (error) {
        }
        await sleep(cpuWait)
        getOP = fetch()
        //decode(getOP)
        if(getOP){
            //console.log(opTable.rows[i])
            decode(getOP)
        }else{
            break
        }
    }
    // for(var i=0; i < pgSize; i++){
    //     setTableInfo()
    //     await sleep(cpuWait)
    //     getOP = fetch()
    //     //decode(getOP)
    //     if(getOP){
    //         //console.log(opTable.rows[i])
    //         decode(getOP)
    //     }else{
    //         break
    //     }
        
	// 	//console.log(`instruction: ${i}`)
	// }

}


function setTableInfo(){
    document.getElementById("tablePC").innerText =`PC: ${vPC.toString(16)}`
    document.getElementById("tableI").innerText =`I: ${vI.toString(16)}`
    document.getElementById("tableV0").innerText =`V0: ${vVX[0].toString(16)}`
    document.getElementById("tableV1").innerText =`V1: ${vVX[1].toString(16)}`
    document.getElementById("tableV2").innerText =`V2: ${vVX[2].toString(16)}`
    document.getElementById("tableV3").innerText =`V3: ${vVX[3].toString(16)}`
    document.getElementById("tableV4").innerText =`V4: ${vVX[4].toString(16)}`
    document.getElementById("tableV5").innerText =`V5: ${vVX[5].toString(16)}`
    document.getElementById("tableV6").innerText =`V6: ${vVX[6].toString(16)}`
    document.getElementById("tableV7").innerText =`V7: ${vVX[7].toString(16)}`
    document.getElementById("tableV8").innerText =`V8: ${vVX[8].toString(16)}`
    document.getElementById("tableV9").innerText =`V9: ${vVX[9].toString(16)}`
    document.getElementById("tableVA").innerText =`VA: ${vVX[10].toString(16)}`
    document.getElementById("tableVB").innerText =`VB: ${vVX[11].toString(16)}`
    document.getElementById("tableVC").innerText =`VC: ${vVX[12].toString(16)}`
    document.getElementById("tableVD").innerText =`VD: ${vVX[13].toString(16)}`
    document.getElementById("tableVE").innerText =`VE: ${vVX[14].toString(16)}`
    document.getElementById("tableVF").innerText =`VF: ${vVX[15].toString(16)}`
    
}

function setEvents(){
    const kb0 = document.getElementById("kb0")
    const kb1 = document.getElementById("kb1")
    const kb2 = document.getElementById("kb2")
    const kb3 = document.getElementById("kb3")
    const kb4 = document.getElementById("kb4")
    const kb5 = document.getElementById("kb5")
    const kb6 = document.getElementById("kb6")
    const kb7 = document.getElementById("kb7")
    const kb8 = document.getElementById("kb8")
    const kb9 = document.getElementById("kb9")
    const kbA = document.getElementById("kbA")
    const kbB = document.getElementById("kbB")
    const kbC = document.getElementById("kbC")
    const kbD= document.getElementById("kbD")
    const kbE = document.getElementById("kbE")
    const kbF = document.getElementById("kbF")

    

    kb0.addEventListener("click", (e) => {
        keys[0] = true
    })

    kb1.addEventListener("click", (e) => {
        keys[1] = true
    })
    kb2.addEventListener("click", (e) => {
        keys[2] = true
    })
    kb3.addEventListener("click", (e) => {
        keys[3] = true
    })
    kb4.addEventListener("click", (e) => {
        keys[4] = true
    })
    kb5.addEventListener("click", (e) => {
        keys[5] = true
    })
    kb6.addEventListener("click", (e) => {
        keys[6] = true
    })
    kb7.addEventListener("click", (e) => {
        keys[7] = true
    })
    kb8.addEventListener("click", (e) => {
        keys[8] = true
    })
    kb9.addEventListener("click", (e) => {
        keys[9] = true
    })
    kbA.addEventListener("click", (e) => {
        keys[0xa] = true
    })
    kbB.addEventListener("click", (e) => {
        keys[0xb] = true
    })
    kbC.addEventListener("click", (e) => {
        keys[0xc] = true
    })
    kbD.addEventListener("click", (e) => {
        keys[0xd] = true
    })
    kbE.addEventListener("click", (e) => {
        keys[0xe] = true
    })
    kbF.addEventListener("click", (e) => {
        keys[0xf] = true
    })



    kb0.addEventListener("mouseup", (e) => {
        keys[0] = false
    })

    kb1.addEventListener("mouseup", (e) => {
        keys[1] = false
    })
    kb2.addEventListener("mouseup", (e) => {
        keys[2] = false
    })
    kb3.addEventListener("mouseup", (e) => {
        keys[3] = false
    })
    kb4.addEventListener("mouseup", (e) => {
        keys[4] = false
    })
    kb5.addEventListener("mouseup", (e) => {
        keys[5] = false
    })
    kb6.addEventListener("mouseup", (e) => {
        keys[6] = false
    })
    kb7.addEventListener("mouseup", (e) => {
        keys[7] = false
    })
    kb8.addEventListener("mouseup", (e) => {
        keys[8] = false
    })
    kb9.addEventListener("mouseup", (e) => {
        keys[9] = false
    })
    kbA.addEventListener("mouseup", (e) => {
        keys[0xa] = false
    })
    kbB.addEventListener("mouseup", (e) => {
        keys[0xb] = false
    })
    kbC.addEventListener("mouseup", (e) => {
        keys[0xc] = false
    })
    kbD.addEventListener("mouseup", (e) => {
        keys[0xd] = false
    })
    kbE.addEventListener("mouseup", (e) => {
        keys[0xe] = false
    })
    kbF.addEventListener("mouseup", (e) => {
        keys[0xf] = false
    })


    
}








