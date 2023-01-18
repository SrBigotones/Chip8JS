#TODO and implement

- [X]    00E0 - CLS
- [X]    00EE - RET
- [ ]    0nnn - SYS addr
- [X]    1nnn - JP addr
- [X]    2nnn - CALL addr
- [X]    3xkk - SE Vx, byte
- [X]    4xkk - SNE Vx, byte
- [X]    5xy0 - SE Vx, Vy
- [X]    6xkk - LD Vx, byte
- [X]    7xkk - ADD Vx, byte
- [X]    8xy0 - LD Vx, Vy
- [X]    8xy1 - OR Vx, Vy
- [X]    8xy2 - AND Vx, Vy
- [X]    8xy3 - XOR Vx, Vy
- [X]    8xy4 - ADD Vx, Vy
- [X]    8xy5 - SUB Vx, Vy
- [X]    8xy6 - SHR Vx {, Vy}
- [X]    8xy7 - SUBN Vx, Vy
- [X]    8xyE - SHL Vx {, Vy}
- [X]    9xy0 - SNE Vx, Vy
- [X]    Annn - LD I, addr
- [X]    Bnnn - JP V0, addr
- [X]    Cxkk - RND Vx, byte
- [X]    Dxyn - DRW Vx, Vy, nibble
- [X]    Ex9E - SKP Vx
- [X]    ExA1 - SKNP Vx
- [X]    Fx07 - LD Vx, DT
- [X]    Fx0A - LD Vx, K
- [X]    Fx15 - LD DT, Vx
- [X]    Fx18 - LD ST, Vx
- [X]    Fx1E - ADD I, Vx
- [X]    Fx29 - LD F, Vx
- [X]    Fx33 - LD B, Vx
- [X]    Fx55 - LD [I], Vx
- [X]    Fx65 - LD Vx, [I]

    
3.2 - Super Chip-48 Instructions
- [ ]    00Cn - SCD nibble
- [ ]    00FB - SCR
- [ ]    00FC - SCL
- [ ]    00FD - EXIT
- [ ]    00FE - LOW
- [ ]    00FF - HIGH
- [ ]    Dxy0 - DRW Vx, Vy, 0
- [ ]    Fx30 - LD HF, Vx
- [ ]    Fx75 - LD R, Vx
- [ ]    Fx85 - LD Vx, R