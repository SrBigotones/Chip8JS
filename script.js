
var vRAM = new Array(4096).fill(0)
var vVX = new Uint8Array(16)//.fill(0) //V0 to VF general registers
var vI = new Uint16Array(1) 
var vTIMER = vSOUND = 0
var bfrCell = ["tblRAM0","tblRAM0"] //the last cells that were edited
var instructionPerDraw = 10
var pixels = new Array(2048).fill(0)
var screenPixel = []
const altShift = 0 //alternative shift operator, 0 = original, VX = VY and then shift // 1 = 90', VX shifts
const cpuWait = 1
var runI = getOP = 0
var vSTACK = new Array()
var pgSize
var keys = new Array(16).fill(false)
const opTable = document.getElementById("opTable")
const startRAM = 512 //Where I start to write to RAM
var vPC = startRAM
var actualFrame
var playSound = false




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
    document.getElementById(bfrCell[0]).style = "background-color:white;"
    document.getElementById(bfrCell[1]).style = "background-color:white;"
    actualOP = (vRAM[vPC] << 8) + (vRAM[vPC+1]) //Big Endian
    bfrCell[0] = `tblRAM${vPC - 512}`
    bfrCell[1] = `tblRAM${vPC - 511}`
    document.getElementById(bfrCell[0]).style = "background-color:green;"
    document.getElementById(bfrCell[1]).style = "background-color:green;"
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
            cleanPixels()
            break;

        case opCODE == 0x00ee://00ee Return
            vPC = vSTACK.pop()
            break;

        case (opCODE & 0xF000) == 0x1000: //1NNN Jump
            vPC = (opCODE & 0xfff)
            break;

        case (opCODE & 0xF000) == 0x2000://2NNN Jump set stack
            vSTACK.push(vPC)
            vPC = (opCODE & 0xfff)
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

        case (opCODE & 0xF000) == 0x6000://6XNN set register VX
            vVX[nibble[0]] = (opCODE & 0xff)//(nibble[1] << 4) + nibble[2]
            break;

        
        case (opCODE & 0xF000) == 0x7000://7XNN add value to register VX
            //console.log(vVX[nibble[0]])
			vVX[nibble[0]] += (opCODE & 0xff)//((nibble[1] << 4) + nibble[2])
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff //Caution of overflow
            //console.log(vVX[nibble[0]])
			break;

        case (opCODE & 0xF00F) == 0x8000: //8XY0 SET
            vVX[nibble[0]] = vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8001: //8XY1 OR
            //vVX[0xf] = 0
            vVX[nibble[0]] = vVX[nibble[0]] | vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8002: //8XY2 AND
            //vVX[0xf] = 0
            vVX[nibble[0]] = vVX[nibble[0]] & vVX[nibble[1]]
            break
        
        case (opCODE & 0xF00F) == 0x8003: //8XY3 XOR
           // vVX[0xf] = 0
            vVX[nibble[0]] = vVX[nibble[0]] ^ vVX[nibble[1]]
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff //caution overflow
            break
        
        case (opCODE & 0xF00F) == 0x8004: //8XY4 ADD
            //vVX[0xf] = 0
            var auxAdd = vVX[nibble[1]] + vVX[nibble[0]]
            
            //if (vVX[nibble[0]] > 0xff){ //Check if overflow
            if (auxAdd > 0xff){
                //vVX[nibble[0]] = vVX[nibble[0]] & 0xFF
                vVX[0xf] = 1
            }else{vVX[0xf] = 0}
            
            vVX[nibble[0]] = (vVX[nibble[0]] + vVX[nibble[1]]) & 0xff

            break

        case (opCODE & 0xF00F) == 0x8005: // 8XY5 Substract
            // vVX[0xf] = 0
            if(vVX[nibble[0]] > vVX[nibble[1]]){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }
            
            vVX[nibble[0]] = vVX[nibble[0]] - vVX[nibble[1]] 
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff

            break

        case (opCODE & 0xF00F) == 0x8007: // 8XY7 Substract
            // vVX[0xf] = 0
            if(vVX[nibble[1]] > vVX[nibble[0]]){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }
            vVX[nibble[0]] = vVX[nibble[1]] - vVX[nibble[0]]
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            
            break

        case (opCODE & 0xF00F) == 0x8006: //8XY6 SHIFT RIGHT
            // vVX[0xf] = 0
            if(altShift == 1){
                vVX[nibble[0]] = vVX[nibble[1]]
            }

            var aux = vVX[nibble[0]] & 0x01
            if(aux == 1){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }
            
            vVX[nibble[0]] = vVX[nibble[0]] >> 1
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff
            
            break
        case (opCODE & 0xF00F) == 0x800E: //8XYE SHIFT LEFT
            // vVX[0xf] = 0
        
            if(altShift == 1){
                vVX[nibble[0]] = vVX[nibble[1]]
            }
            var aux = vVX[nibble[0]] & 0x80
            if(aux == 0x80){
                vVX[0xf] = 1
            }else{
                vVX[0xf] = 0
            }

            vVX[nibble[0]] = vVX[nibble[0]] << 1
            vVX[nibble[0]] = vVX[nibble[0]] & 0xff

            break
        
        case (opCODE & 0xF000) == 0x9000://9XY0 SKIP
            if (vVX[nibble[0]] != vVX[nibble[1]]) {
                vPC += 2
            }
            break;

        case (opCODE & 0xF000) == 0xA000://ANNN set index register I
            vI[0] = opCODE & 0xFFF
            break;
        
        case (opCODE & 0xF000) == 0xB000://BNNN Jump with offset
            vPC = ((opCODE & 0xfff) + vVX[0])
            // vPC = vPC & 0xfff
            break;

        case (opCODE & 0xF000) == 0xC000://CXNN Random
            vVX[nibble[0]] = Math.floor(Math.random() * 0xff) & (opCODE & 0xff)
            break;
        // #################KEYS#################
        case (opCODE & 0xF0FF) == 0xE09E: // EX9E Skip if key
            if(keys[vVX[nibble[0]]] == true){
                vPC += 2
            }
            break
        case (opCODE & 0xF0FF) == 0xE0A1:// EXA1 Skip if key
            // stopNOW = true
            //console.log(`ASK KEY: `)
            if (keys[vVX[nibble[0]]] == false){
                vPC += 2
            }

            // console.log(keys)
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
            vI[0] += vVX[nibble[0]]
            break

        case (opCODE & 0xF0FF) == 0xF00A:// FX0A Get key
            var aux = keys.indexOf(true)

            if(aux != -1){
                vVX[nibble[0]] = aux
            }else{
                vPC -= 2
            }
            break
        
        case (opCODE & 0xF0FF) == 0xF029:// FX29 Font Character
            //Fonts stored in 0x50, 5 bytes per character
            vI[0] = (5 * vVX[nibble[0]])
            //stopNOW = true
            //console.log(`READ FONT: ${vRAM[vI[0]]} ${(5 * vVX[nibble[0]])} ${vI[0]}`)
            break
        
        case (opCODE & 0xF0FF) == 0xF033:// FX33 Binary-coded decimal conversion
            var foo = vVX[nibble[0]]
            // stopNOW = true
            vRAM[vI[0]] = parseInt(foo/100)
            vRAM[vI[0]+1] = parseInt((foo%100)/10)
            vRAM[vI[0]+2] = parseInt((foo%10))
            //need to update those cells
            document.getElementById(`tblRAM${vI[0] - 512}`).innerHTML = ("0" + vRAM[vI[0]].toString(16).toUpperCase())
            document.getElementById(`tblRAM${vI[0] - 511}`).innerHTML = ("0" + vRAM[vI[0]+1].toString(16).toUpperCase())
            document.getElementById(`tblRAM${vI[0] - 510}`).innerHTML = ("0" + vRAM[vI[0]+2].toString(16).toUpperCase())
            
            // vI += 2
            break
        
        case (opCODE & 0xF0FF) == 0xF055:// FX55 Store Memory
            var auxi 
            for (let i = 0; i <= nibble[0]; i++) {
                vRAM[vI[0] + i] = vVX[i]
                auxi = vVX[i].toString(16)
                if (auxi <= 0xf) { auxi = "0" + auxi }
                document.getElementById(`tblRAM${vI[0]+i - 512}`).innerHTML = auxi.toUpperCase()
            }
            //vI += 2
            break
        case (opCODE & 0xF0FF) == 0xF065:// FX65 Load Memory
            for (let i = 0; i <= nibble[0]; i++) {
                vVX[i] = vRAM[vI[0] + i]
            }
            break

        case (opCODE & 0xF000) == 0xD000://DXYN display/draw
            // stopNOW = true
            let x = vVX[nibble[0]] //% 63
            let y = vVX[nibble[1]] //% 31
            let pixelLine = 0
            vVX[0xF] = 0 //VF 

            for (let h = 0; h < nibble[2]; h++) {
                pixelLine = vRAM[vI[0] + h]
				
                for (let j = 0; j < 8; j++) {
                    if((x+j > 63) | (y+h > 31)){break}
                    
                    if ((pixelLine & (0x80 >> j)) != 0){
                        if(screenPixel[x+j][y+h] == 1){
                        // if(oX[x+j] == 1 & oY[y+h] == 1){
                            // drawPixel(x+j, y+h, 0)
                            vVX[0xf] = 1
                        }
                        screenPixel[x + j][y + h] ^= 1
                    }
                }
            }
            
            break;
        default:
            console.log("OPCODE UNKOWN")
            stopNOW = true
            break;
    }
}


function openfile() {
    vRAM = new Array(4096).fill(0)

    // osc = audioContext.createOscillator()
    // gainOsc = audioContext.createGain()
    // osc.type = "sine"
    // osc.connect(gainOsc)
    // osc.start()
    // gainOsc.connect(audioContext.destination)
    // //gainOsc.gain.
    // gainOsc.gain.exponentialRampToValueAtTime(
    //     0.0001, audioContext.currentTime 
    // )
    //osc.connect(audioContext.destination)

    VX = new Uint8Array(16) //V0 to VF general registers
    vI[0] = vTIMER = vSOUND = 0
    runI = getOP = 0
    vSTACK = new Array()
    pgSize = 0
    vPC = startRAM
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    cleanPixels()
    writeFonts(0x0)

	var input = document.getElementById("inputROM").files;
	var fileData = new Blob([input[0]]);
    let aux = new Array(2)

	var reader = new FileReader();
	reader.readAsArrayBuffer(fileData);
	reader.onload = function(){
		var arrayBuffer = reader.result
		var bytes = new Uint8Array(arrayBuffer);
        pgSize = bytes.length
        writeRAMtbl(pgSize)
		//console.log(bytes);
		//console.log(bytes.length)
		for(var i = 0; i < pgSize; i++){
			//console.log("caca")
			vRAM[startRAM + i] = bytes[i]

            let aux = bytes[i].toString(16)
            if(aux.length == 1){aux = `0`+aux}
            document.getElementById(`tblRAM${i}`).innerHTML = aux.toUpperCase()
            //console.log(vRAM[startRAM+i].toString(16))
            // if(i % 2 == 1){
            //     writeDivOP((bytes[i-1] << 8) + bytes[i])
            // }
		}
	}
}

function cleanPixels(){
    screenPixel = []
    for (let i = 0; i < 64; i++) {
        let aux = []
        for (let h = 0; h < 32; h++) {
            aux.push(0)
        }
        screenPixel.push(aux)

    }
}


function render(){
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 32; y++) {
            drawPixel(x,y,screenPixel[x][y])
        }
    }
}

function drawPixel(xd, yd, c){
	// console.log(`draw ${xd} ${yd} ${screenPixel[xd][yd]}`)
    ctx.beginPath();
    ctx.rect(xd*10, yd*10, 10, 10);
    if(c == 1){
        //draw
        ctx.fillStyle = `white`;//`rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
    }else{
        //clean per se
        ctx.fillStyle = `black`;//`rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`;
    }
    ctx.fill();
    ctx.closePath();    
}

writeFonts(0x0)

//loadPG()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function runOne(){
    //console.log(`I: ${runI}`)
    
    // await sleep(cpuWait)

    if (vTIMER != 0) {

        vTIMER--
    }
    if (vSOUND != 0) {
        if(playSound == false) {
            //gainOsc.connect(audioContext.destination)
            gainOsc.gain.exponentialRampToValueAtTime(
                .12, audioContext.currentTime + 0.04
            )
            playSound = true
        }
        vSOUND--
    }else{
        if(playSound == true){
            gainOsc.gain.exponentialRampToValueAtTime(
                0.00001, audioContext.currentTime + 0.1
            )
            //gainOsc.disconnect(audioContext.destination)
            playSound = false
        } 
    }

    for (let step = 0; step < instructionPerDraw; step++) {
        getOP = fetch()
        // decode(getOP)
        if(getOP){
            //console.log(opTable.rows[runI])
            decode(getOP)
        }else{
            return
        }

        try {
            setTableInfo()
            
        } catch (error) {
            
        }
        
    }
    
    //console.log(`instruction: ${runI}`)
    runI += 1
    render()
    if (stopNOW == false){
        actualFrame = requestAnimationFrame(runOne);
    }
    // setTimeout(() => {
        
    // }, 1);

}



function startME(){
    console.log("################START##############")
    console.log(vRAM[0x229])
    console.log("################START##############")
    instructionPerDraw = 10
    requestAnimationFrame(runOne)
    // while((vPC < pgSize + 512) & (stopNOW == false)){
    //     actualFrame = Date.now()
    
    //     console.log(actualFrame)
        
    // //     // try {
    // //     //     setTableInfo()
            
    // //     // } catch (error) {
    // //     // }
    // //     // await sleep(cpuWait)
    // //     // getOP = fetch()
    // //     // //decode(getOP)
    // //     // if(getOP){
    // //     //     //console.log(opTable.rows[i])
    // //     //     decode(getOP)
    // //     // }else{
    // //     //     break
    // //     // }
    // }

}



function writeRAMtbl(progLen){
    //Write the ram table for debuggin purposes
    let htmlCode = ``
    let cont = 0
    let i = 0
    while(i < progLen) {
        htmlCode += `<tr>`
        for (let h = 0; h < 20; h++) {
            htmlCode += `<th id="tblRAM${i}">00</th>`
            i++
            if(i>progLen){break}
        }
        htmlCode += `</tr>`
    }
    opTable.innerHTML = htmlCode
}


function setTableInfo(){
    document.getElementById("tablePC").innerText =`${vPC.toString(16)}` 
    document.getElementById("tableI").innerText =`${vI.toString(16)}`
    document.getElementById("tableV0").innerText = (vVX[0] > 0xf) ? `${vVX[0].toString(16)}` : `0${vVX[0].toString(16)}`
    document.getElementById("tableV1").innerText = (vVX[1] > 0xf) ? `${vVX[1].toString(16)}` : `0${vVX[1].toString(16)}`
    document.getElementById("tableV2").innerText = (vVX[2] > 0xf) ? `${vVX[2].toString(16)}` : `0${vVX[2].toString(16)}`
    document.getElementById("tableV3").innerText = (vVX[3] > 0xf) ? `${vVX[3].toString(16)}` : `0${vVX[3].toString(16)}`
    document.getElementById("tableV5").innerText = (vVX[4] > 0xf) ? `${vVX[4].toString(16)}` : `0${vVX[4].toString(16)}`
    document.getElementById("tableV6").innerText = (vVX[5] > 0xf) ? `${vVX[5].toString(16)}` : `0${vVX[5].toString(16)}`
    document.getElementById("tableV7").innerText = (vVX[6] > 0xf) ? `${vVX[6].toString(16)}` : `0${vVX[6].toString(16)}`
    document.getElementById("tableV8").innerText = (vVX[7] > 0xf) ? `${vVX[7].toString(16)}` : `0${vVX[7].toString(16)}`
    document.getElementById("tableV9").innerText = (vVX[8] > 0xf) ? `${vVX[8].toString(16)}` : `0${vVX[8].toString(16)}`
    document.getElementById("tableVA").innerText = (vVX[9] > 0xf) ? `${vVX[9].toString(16)}` : `0${vVX[9].toString(16)}`
    document.getElementById("tableVB").innerText = (vVX[10] > 0xf) ? `${vVX[10].toString(16)}` : `0${vVX[10].toString(16)}`
    document.getElementById("tableVC").innerText = (vVX[11] > 0xf) ? `${vVX[11].toString(16)}` : `0${vVX[11].toString(16)}`
    document.getElementById("tableVD").innerText = (vVX[12] > 0xf) ? `${vVX[12].toString(16)}` : `0${vVX[12].toString(16)}`
    document.getElementById("tableVE").innerText = (vVX[13] > 0xf) ? `${vVX[13].toString(16)}` : `0${vVX[13].toString(16)}`
    document.getElementById("tableVF").innerText = (vVX[14] > 0xf) ? `${vVX[14].toString(16)}` : `0${vVX[14].toString(16)}`
    
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

    var kb0OUT = ()=>{
        keys[0] = false
    }
    var kb1OUT = () => {
        keys[1] = false
    }
    var kb2OUT = () => {
        keys[2] = false
    }
    var kb3OUT = () => {
        keys[3] = false
    }
    var kb4OUT = () => {
        keys[4] = false
    }
    var kb5OUT = () => {
        keys[5] = false
    }
    var kb6OUT = () => {
        keys[6] = false
    }
    var kb7OUT = () => {
        keys[7] = false
    }
    var kb8OUT = () => {
        keys[8] = false
    }
    var kb9OUT = () => {
        keys[9] = false
    }
    var kbAOUT = () => {
        keys[10] = false
    }
    var kbBOUT = () => {
        keys[11] = false
    }
    var kbCOUT = () => {
        keys[12] = false
    }
    var kbDOUT = () => {
        keys[13] = false
    }
    var kbEOUT = () => {
        keys[14] = false
    }
    var kbFOUT = () => {
        keys[15] = false
    }

    var kb0IN = () => {
        keys[0] = true
    }
    var kb1IN = () => {
        keys[1] = true
    }
    var kb2IN = () => {
        keys[2] = true
    }
    var kb3IN = () => {
        keys[3] = true
    }
    var kb4IN = () => {
        keys[4] = true
    }
    var kb5IN = () => {
        keys[5] = true
    }
    var kb6IN = () => {
        keys[6] = true
    }
    var kb7IN = () => {
        keys[7] = true
    }
    var kb8IN = () => {
        keys[8] = true
    }
    var kb9IN = () => {
        keys[9] = true
    }
    var kbAIN = () => {
        keys[10] = true
    }
    var kbBIN = () => {
        keys[11] = true
    }
    var kbCIN = () => {
        keys[12] = true
    }
    var kbDIN = () => {
        keys[13] = true
    }
    var kbEIN = () => {
        keys[14] = true
    }
    var kbFIN = () => {
        keys[15] = true
    }

    kb0.addEventListener("mousedown",kb0IN,false)
    kb0.addEventListener("touchstart",kb0IN, false)

    kb1.addEventListener("mousedown", kb1IN, false)
    kb1.addEventListener("touchstart", kb1IN, false)
    
    kb2.addEventListener("mousedown", kb2IN, false)
    kb2.addEventListener("touchstart", kb2IN, false)
    
    kb3.addEventListener("mousedown", kb3IN, false)
    kb3.addEventListener("touchstart", kb3IN, false)

    kb4.addEventListener("mousedown", kb4IN, false)
    kb4.addEventListener("touchstart", kb4IN, false)

    kb5.addEventListener("mousedown", kb5IN, false)
    kb5.addEventListener("touchstart", kb5IN, false)

    kb6.addEventListener("mousedown", kb6IN, false)
    kb6.addEventListener("touchstart", kb6IN, false)

    kb7.addEventListener("mousedown", kb7IN, false)
    kb7.addEventListener("touchstart", kb7IN, false)

    kb8.addEventListener("mousedown", kb8IN, false)
    kb8.addEventListener("touchstart", kb8IN, false)

    kb9.addEventListener("mousedown", kb9IN, false)
    kb9.addEventListener("touchstart", kb9IN, false)

    kbA.addEventListener("mousedown", kbAIN, false)
    kbA.addEventListener("touchstart", kbAIN, false)

    kbB.addEventListener("mousedown", kbBIN, false)
    kbB.addEventListener("touchstart", kbBIN, false)

    kbC.addEventListener("mousedown", kbCIN, false)
    kbC.addEventListener("touchstart", kbCIN, false)

    kbD.addEventListener("mousedown", kbDIN, false)
    kbD.addEventListener("touchstart", kbDIN, false)

    kbE.addEventListener("mousedown", kbEIN, false)
    kbE.addEventListener("touchstart", kbEIN, false)

    kbF.addEventListener("mousedown", kbFIN, false)
    kbF.addEventListener("touchstart", kbFIN, false)


    kb0.addEventListener("mouseup", kb0OUT, false)
    kb0.addEventListener("touchend", kb0OUT, false)
    kb0.addEventListener("mouseleave", kb0OUT, false)

    kb1.addEventListener("mouseup", kb1OUT, false)
    kb1.addEventListener("touchend", kb1OUT, false)
    kb1.addEventListener("mouseleave", kb1OUT, false)

    kb2.addEventListener("mouseup", kb2OUT, false)
    kb2.addEventListener("touchend", kb2OUT, false)
    kb2.addEventListener("mouseleave", kb2OUT, false)
    
    kb3.addEventListener("mouseup", kb3OUT, false)
    kb3.addEventListener("touchend", kb3OUT, false)
    kb3.addEventListener("mouseleave", kb3OUT, false)

    kb4.addEventListener("mouseup", kb4OUT, false)
    kb4.addEventListener("touchend", kb4OUT, false)
    kb4.addEventListener("mouseleave", kb4OUT, false)

    kb5.addEventListener("mouseup", kb5OUT, false)
    kb5.addEventListener("touchend", kb5OUT, false)
    kb5.addEventListener("mouseleave", kb5OUT, false)

    kb6.addEventListener("mouseup", kb6OUT, false)
    kb6.addEventListener("touchend", kb6OUT, false)
    kb6.addEventListener("mouseleave", kb6OUT, false)

    kb7.addEventListener("mouseup", kb7OUT, false)
    kb7.addEventListener("touchend", kb7OUT, false)
    kb7.addEventListener("mouseleave", kb7OUT, false)

    kb8.addEventListener("mouseup", kb8OUT, false)
    kb8.addEventListener("touchend", kb8OUT, false)
    kb8.addEventListener("mouseleave", kb8OUT, false)

    kb9.addEventListener("mouseup", kb9OUT, false)
    kb9.addEventListener("touchend", kb9OUT, false)
    kb9.addEventListener("mouseleave", kb9OUT, false)

    kbA.addEventListener("mouseup", kbAOUT, false)
    kbA.addEventListener("touchend", kbAOUT, false)
    kbA.addEventListener("mouseleave", kbAOUT, false)

    kbB.addEventListener("mouseup", kbBOUT, false)
    kbB.addEventListener("touchend", kbBOUT, false)
    kbB.addEventListener("mouseleave", kbBOUT, false)
    
    kbC.addEventListener("mouseup", kbCOUT, false)
    kbC.addEventListener("touchend", kbCOUT, false)
    kbC.addEventListener("mouseleave", kbCOUT, false)

    kbD.addEventListener("mouseup", kbDOUT, false)
    kbD.addEventListener("touchend", kbDOUT, false)
    kbD.addEventListener("mouseleave", kbDOUT, false)

    kbE.addEventListener("mouseup", kbEOUT, false)
    kbE.addEventListener("touchend", kbEOUT, false)
    kbE.addEventListener("mouseleave", kbEOUT, false)
    
    kbF.addEventListener("mouseup", kbFOUT, false)
    kbF.addEventListener("touchend", kbFOUT, false)
    kbF.addEventListener("mouseleave", kbFOUT, false)


    document.addEventListener("keydown", (e)=>{
        var name = e.key
        var code = e.code
        switch (code) {
            case "Digit1":
                keys[1] = true
                break;
            case "Digit2":
                keys[2] = true
                break;
            case "Digit3":
                keys[3] = true
                break;
            case "Digit4":
                keys[0xc] = true
                break;
            case "KeyQ":
                keys[4] = true
                break;
            case "KeyW":
                keys[5] = true
                break;
            case "KeyE":
                keys[6] = true
                break;
            case "KeyR":
                keys[0xd] = true
                break;
            case "KeyA":
                keys[7] = true
                break;
            case "KeyS":
                keys[8] = true
                break;
            case "KeyD":
                keys[9] = true
                break;
            case "KeyF":
                keys[0xe] = true
                break;
            case "KeyZ":
                keys[0xa] = true
                break;
            case "KeyX":
                keys[0x0] = true
                break;
            case "KeyC":
                keys[0xb] = true
                break;
            case "KeyV":
                keys[0xf] = true
                break;
        }
    })
    document.addEventListener("keyup", (e) => {
        var name = e.key
        var code = e.code
        switch (code) {
            case "Digit1":
                keys[1] = false
                break;
            case "Digit2":
                keys[2] = false
                break;
            case "Digit3":
                keys[3] = false
                break;
            case "Digit4":
                keys[0xc] = false
                break;
            case "KeyQ":
                keys[4] = false
                break;
            case "KeyW":
                keys[5] = false
                break;
            case "KeyE":
                keys[6] = false
                break;
            case "KeyR":
                keys[0xd] = false
                break;
            case "KeyA":
                keys[7] = false
                break;
            case "KeyS":
                keys[8] = false
                break;
            case "KeyD":
                keys[9] = false
                break;
            case "KeyF":
                keys[0xe] = false
                break;
            case "KeyZ":
                keys[0xa] = false
                break;
            case "KeyX":
                keys[0x0] = false
                break;
            case "KeyC":
                keys[0xb] = false
                break;
            case "KeyV":
                keys[0xf] = false
                break;
        }
    })

    
}








