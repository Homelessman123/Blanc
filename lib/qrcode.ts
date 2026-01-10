type Bit = 0 | 1;
type Byte = number;

export type QrEcc = 'L' | 'M' | 'Q' | 'H';

const ECC_INDEX: Record<QrEcc, number> = {
  L: 0,
  M: 1,
  Q: 2,
  H: 3,
};

// Facts from the QR Code Model 2 spec (ISO/IEC 18004).
// Index 0 is padding and intentionally invalid.
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // L
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // M
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Q
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // H
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // L
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // M
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Q
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81], // H
];

const GF_EXP: number[] = [];
const GF_LOG: number[] = [];

function initGaloisFieldTables() {
  if (GF_EXP.length) return;
  GF_EXP.length = 512;
  GF_LOG.length = 256;

  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}

function gfMultiply(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  initGaloisFieldTables();
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsComputeDivisor(degree: number): Byte[] {
  if (degree < 1 || degree > 255) throw new Error('Invalid RS degree');
  const result: Byte[] = new Array(degree).fill(0);
  result[degree - 1] = 1;

  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }

  return result;
}

function rsComputeRemainder(data: ReadonlyArray<Byte>, divisor: ReadonlyArray<Byte>): Byte[] {
  const result: Byte[] = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < divisor.length; i += 1) {
      result[i] ^= gfMultiply(divisor[i], factor);
    }
  }
  return result;
}

function appendBits(out: Bit[], value: number, length: number) {
  if (length < 0 || length > 31 || (value >>> length) !== 0) throw new Error('Bit append out of range');
  for (let i = length - 1; i >= 0; i -= 1) {
    out.push(((value >>> i) & 1) as Bit);
  }
}

function getNumRawDataModules(version: number) {
  if (version < 1 || version > 40) throw new Error('Version out of range');
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version: number, ecc: QrEcc) {
  const eccIndex = ECC_INDEX[ecc];
  const totalCodewords = Math.floor(getNumRawDataModules(version) / 8);
  return totalCodewords - ECC_CODEWORDS_PER_BLOCK[eccIndex][version] * NUM_ERROR_CORRECTION_BLOCKS[eccIndex][version];
}

function getAlignmentPatternPositions(version: number) {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

function getBit(x: number, i: number) {
  return ((x >>> i) & 1) !== 0;
}

function getBchDigit(x: number) {
  let i = 0;
  while (x !== 0) {
    i += 1;
    x >>>= 1;
  }
  return i;
}

function calcBchCode(value: number, poly: number) {
  let x = value;
  while (getBchDigit(x) - getBchDigit(poly) >= 0) {
    x ^= poly << (getBchDigit(x) - getBchDigit(poly));
  }
  return x;
}

function calcFormatBits(ecc: QrEcc, mask: number) {
  // ECL format bits: L=01, M=00, Q=11, H=10
  const eclBits = ecc === 'L' ? 1 : ecc === 'M' ? 0 : ecc === 'Q' ? 3 : 2;
  const data = (eclBits << 3) | mask;
  const rem = calcBchCode(data << 10, 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function calcVersionBits(version: number) {
  const rem = calcBchCode(version << 12, 0x1f25);
  return (version << 12) | rem;
}

function makeEmptyMatrix(size: number) {
  const modules: Array<Array<boolean | null>> = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  return { modules, isFunction, setFunctionModule };
}

function drawFinderPattern(set: (x: number, y: number, dark: boolean) => void, size: number, x: number, y: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || xx >= size || yy < 0 || yy >= size) continue;

      const isSeparator = dx === -1 || dx === 7 || dy === -1 || dy === 7;
      const isOuter = dx === 0 || dx === 6 || dy === 0 || dy === 6;
      const isInner = dx === 1 || dx === 5 || dy === 1 || dy === 5;
      const dark = !isSeparator && (isOuter || (!isInner && dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      set(xx, yy, dark);
    }
  }
}

function drawAlignmentPattern(set: (x: number, y: number, dark: boolean) => void, x: number, y: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      set(x + dx, y + dy, dist !== 1);
    }
  }
}

function placeFormatBits(set: (x: number, y: number, dark: boolean) => void, size: number, formatBits: number) {
  for (let i = 0; i <= 5; i += 1) set(8, i, getBit(formatBits, i));
  set(8, 7, getBit(formatBits, 6));
  set(8, 8, getBit(formatBits, 7));
  set(7, 8, getBit(formatBits, 8));
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, getBit(formatBits, i));

  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, getBit(formatBits, i));
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, getBit(formatBits, i));
}

function placeVersionBits(set: (x: number, y: number, dark: boolean) => void, size: number, versionBits: number) {
  for (let i = 0; i < 18; i += 1) {
    const bit = getBit(versionBits, i);
    const x = size - 11 + (i % 3);
    const y = Math.floor(i / 3);
    set(x, y, bit);
    set(y, x, bit);
  }
}

function applyMask(modules: Array<Array<boolean | null>>, isFunction: boolean[][], mask: number) {
  const size = modules.length;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFunction[y][x]) continue;
      const condition =
        mask === 0 ? (x + y) % 2 === 0
          : mask === 1 ? y % 2 === 0
            : mask === 2 ? x % 3 === 0
              : mask === 3 ? (x + y) % 3 === 0
                : mask === 4 ? (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
                  : mask === 5 ? ((x * y) % 2 + (x * y) % 3) === 0
                    : mask === 6 ? (((x * y) % 2 + (x * y) % 3) % 2) === 0
                      : (((x + y) % 2 + (x * y) % 3) % 2) === 0;

      if (condition) modules[y][x] = !modules[y][x];
    }
  }
}

export function createQrMatrix(text: string, ecc: QrEcc = 'M'): boolean[][] {
  const dataBytes = Array.from(new TextEncoder().encode(text));

  const eccIndex = ECC_INDEX[ecc];
  if (eccIndex === undefined) throw new Error('Unsupported ECC level');

  let version = 0;
  for (let v = 1; v <= 40; v += 1) {
    const capacityBits = getNumDataCodewords(v, ecc) * 8;
    const countBits = v <= 9 ? 8 : 16;
    const requiredBits = 4 + countBits + dataBytes.length * 8;
    if (requiredBits <= capacityBits) {
      version = v;
      break;
    }
  }
  if (version === 0) throw new Error('Data too long for QR code');

  const size = version * 4 + 17;
  const dataCapacityBits = getNumDataCodewords(version, ecc) * 8;

  const bb: Bit[] = [];
  appendBits(bb, 0b0100, 4); // byte mode
  appendBits(bb, dataBytes.length, version <= 9 ? 8 : 16);
  for (const b of dataBytes) appendBits(bb, b, 8);

  const terminator = Math.min(4, dataCapacityBits - bb.length);
  for (let i = 0; i < terminator; i += 1) bb.push(0);
  while (bb.length % 8 !== 0) bb.push(0);

  const dataCodewords: Byte[] = [];
  for (let i = 0; i < bb.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j += 1) val = (val << 1) | bb[i + j];
    dataCodewords.push(val);
  }

  const dataCodewordCapacity = getNumDataCodewords(version, ecc);
  for (let pad = 0; dataCodewords.length < dataCodewordCapacity; pad ^= 1) {
    dataCodewords.push(pad ? 0x11 : 0xec);
  }

  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[eccIndex][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[eccIndex][version];

  const divisor = rsComputeDivisor(blockEccLen);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const blocks: { data: Byte[]; ecc: Byte[] }[] = [];
  let cursor = 0;
  for (let i = 0; i < numBlocks; i += 1) {
    const blockLen = shortBlockLen + (i >= numShortBlocks ? 1 : 0);
    const dataLen = blockLen - blockEccLen;
    const blockData = dataCodewords.slice(cursor, cursor + dataLen);
    cursor += dataLen;
    const blockEcc = rsComputeRemainder(blockData, divisor);
    blocks.push({ data: blockData, ecc: blockEcc });
  }

  const interleaved: Byte[] = [];
  const maxDataLen = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxDataLen; i += 1) {
    for (const b of blocks) {
      if (i < b.data.length) interleaved.push(b.data[i]);
    }
  }
  for (let i = 0; i < blockEccLen; i += 1) {
    for (const b of blocks) interleaved.push(b.ecc[i]);
  }

  const rawDataModules = getNumRawDataModules(version);
  const remainderBits = rawDataModules - interleaved.length * 8;
  const allBits: Bit[] = [];
  for (const cw of interleaved) appendBits(allBits, cw, 8);
  for (let i = 0; i < remainderBits; i += 1) allBits.push(0);

  const { modules, isFunction, setFunctionModule } = makeEmptyMatrix(size);

  drawFinderPattern(setFunctionModule, size, 0, 0);
  drawFinderPattern(setFunctionModule, size, size - 7, 0);
  drawFinderPattern(setFunctionModule, size, 0, size - 7);

  const alignPos = getAlignmentPatternPositions(version);
  for (const y of alignPos) {
    for (const x of alignPos) {
      const isOverlappingFinder =
        (x === 6 && y === 6) ||
        (x === 6 && y === size - 7) ||
        (x === size - 7 && y === 6);
      if (isOverlappingFinder) continue;
      drawAlignmentPattern(setFunctionModule, x, y);
    }
  }

  for (let i = 0; i < size; i += 1) {
    if (!isFunction[6][i]) setFunctionModule(i, 6, i % 2 === 0);
    if (!isFunction[i][6]) setFunctionModule(6, i, i % 2 === 0);
  }

  setFunctionModule(8, size - 8, true); // dark module

  // Reserve format info areas (will be overwritten later)
  for (let i = 0; i <= 5; i += 1) setFunctionModule(8, i, false);
  setFunctionModule(8, 7, false);
  setFunctionModule(8, 8, false);
  setFunctionModule(7, 8, false);
  for (let i = 0; i <= 5; i += 1) setFunctionModule(i, 8, false);
  for (let i = 0; i < 8; i += 1) setFunctionModule(size - 1 - i, 8, false);
  for (let i = 0; i < 7; i += 1) setFunctionModule(8, size - 1 - i, false);

  // Reserve version info areas (will be overwritten later)
  if (version >= 7) {
    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        setFunctionModule(size - 11 + x, y, false);
        setFunctionModule(y, size - 11 + x, false);
      }
    }
  }

  // Place data bits
  let bitIndex = 0;
  let upward = true;
  for (let x = size - 1; x >= 1; x -= 2) {
    if (x === 6) x -= 1;
    for (let i = 0; i < size; i += 1) {
      const y = upward ? size - 1 - i : i;
      for (let dx = 0; dx < 2; dx += 1) {
        const xx = x - dx;
        if (isFunction[y][xx]) continue;
        modules[y][xx] = allBits[bitIndex] === 1;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }

  // Fixed mask pattern 0 (good enough for on-screen QR codes)
  const mask = 0;
  applyMask(modules, isFunction, mask);

  const formatBits = calcFormatBits(ecc, mask);
  placeFormatBits(setFunctionModule, size, formatBits);

  if (version >= 7) {
    const versionBits = calcVersionBits(version);
    placeVersionBits(setFunctionModule, size, versionBits);
  }

  // Convert to plain boolean matrix
  return modules.map((row) => row.map((cell) => cell === true));
}
