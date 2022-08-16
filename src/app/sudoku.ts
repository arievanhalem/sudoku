// CONST EN TYPES
export const BLOCKSIZE = 3
export const SIZE = BLOCKSIZE * BLOCKSIZE
export const BOARDSIZE = SIZE * SIZE

export type cell = {
  value: number;
  options: number[];
  frozen: boolean;
}

export type board = {
  cells: cell[]
}

// PRIVATE HELPER FUNCTIONS //
const range = (l: number) => [...Array(l).keys()]

const shuffle = (source: any[]) => source
  .map(v => ({ v, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ v }) => v)

const getCellIndex = (row: number, column: number) => (row * SIZE) + column

const getRowColumnIndex = (idx: number) => [
  Math.floor(idx / SIZE),
  idx - (Math.floor(idx / SIZE) * SIZE)
]

const getRowIndexes = (row: number) => range(SIZE).map(i => i + (row * SIZE))

const getColumnIndexes = (column: number) => range(SIZE).map(i => (i * SIZE) + column)

const getBlockIndexes = (row: number, column: number) => {
  const fstRow = Math.floor(row / BLOCKSIZE) * BLOCKSIZE
  const fstCol = Math.floor(column / BLOCKSIZE) * BLOCKSIZE
  const it = range(BLOCKSIZE)
  return it.map(i => i + fstRow).flatMap(r => it.map(i => r * 9 + i + fstCol))
}

const isValidInRow = (b: number[], row: number, value: number) =>
  getRowIndexes(row).reduce((a, i) => a && (b[i] !== value), true)

const isValidInColumn = (b: number[], column: number, value: number) =>
  getColumnIndexes(column).reduce((a, i) => a && (b[i] !== value), true)

const isValidInBlock = (b: number[], row: number, column: number, value: number) =>
  getBlockIndexes(row, column).reduce((a, i) => a && (b[i] !== value), true)

const isValidValue = (b: number[], row: number, column: number, value: number) =>
  (b.length === BOARDSIZE) && isValidInColumn(b, column, value) && isValidInRow(b, row, value) && isValidInBlock(b, row, column, value)

const isValidOnIndex = (b: number[], idx: number, value: number) => {
  const [r, c] = getRowColumnIndex(idx)
  return isValidValue(b, r, c, value)
}

const stringify = (b: number[]) => {
  if (b.length !== BOARDSIZE) {
    return range(BOARDSIZE).map(_ => '_').join('')
  }
  return b.map(c => c ? c.toString() : '_').join('')
}

const getEmptyBoard = () => ({
  cells: range(BOARDSIZE)
    .map(n => ({
      value: undefined,
      options: [],
      frozen: false
    }))
} as board)

const getRandomSolution = () =>
  solve(getEmptyBoard().cells.map(c => c.value), 1, true)[0]
    .split('')
    .map(c => c === '_' ? undefined : parseInt(c))

const solve = (b: number[], K: number = 1, randomize: boolean = false): string[] => {
  if (b.length !== BOARDSIZE) {
    return [] as string[]
  }

  const idx = b.findIndex(i => !i)

  if (idx === -1) {
    return [stringify(b)]
  }

  const numbers = randomize ? shuffle(range(SIZE)) : range(SIZE)
  return numbers.reduce((ret, n) => {
    if ((ret.length < K) && isValidOnIndex(b, idx, n + 1)) {
      const nwB = [].concat(b)
      nwB[idx] = n + 1
      return ret.concat(solve(nwB, K, randomize))
    } else {
      return ret
    }
  }, [])
}

const getShuffeledIndexes = (solution: number[], K: number) => {
  let factor = K - 20 / 40
  factor = factor < 0 ? 0 : factor > 1 ? 1 : factor
  const weights = [-0.5,-0.5,-0.65,-0.85,0,0.15,0.35,0.5,0.5].map(w => (w * factor) + 1)
  const rowWeights = shuffle(weights)
  const colWeights = shuffle(weights)
  const numWeights = shuffle(weights)

  return range(BOARDSIZE).map(i => {
    const [r,c] = getRowColumnIndex(i)
    const w = rowWeights[r] * colWeights[c] * numWeights[solution[i]-1] * Math.random();
    return {i, w}
  }).sort((a,b) => a.w > b.w ? 1 : -1).map(o => o.i)
}

const punchHoles = (solution: number[], K: number, indexes: number[])  => {
  const result = [].concat(solution)
  let idxs = [].concat(indexes)

  result[idxs[0]] = undefined
  idxs = idxs.slice(1)
  let count = K - 1
  while (count > 0 && idxs.length > 0) {
    let numSol = 0
    const idx = idxs[0]
    idxs = idxs.slice(1)
    const currentNumber = result[idx]
    result[idx] = undefined
    numSol = solve(result, 1).length
    if (numSol === 0) {
      // er is geen oplossing voor dit grid
      result[idx] = currentNumber
      console.log(`${new Date().toISOString()} Zoekstap (geen oplossing): ${idxs.length}/81 ${K - count}/${K}`)
    } else {
      // heeft een van de andere nummers 1 oplossing, dan zijn er meerdere oplossingen
      numSol = 0
      let numbers = range(SIZE).map(n => n + 1).filter(n => n !== currentNumber)
      while (numSol === 0 && numbers.length > 0) {
        const testNumber = numbers[0]
        numbers = numbers.slice(1)
        if (isValidOnIndex(result, idx, testNumber)) {
          const testOptie = [].concat(result)
          testOptie[idx] = testNumber
          numSol = solve(testOptie, 1).length
          console.log(`${new Date().toISOString()} Zoekstap index ${idx}, nummer ${testNumber}, oplossingen ${numSol}`)
        }
      }

      if (numSol !== 0) {
        result[idx] = currentNumber
        console.log(`${new Date().toISOString()} Zoekstap (meerdere oplossingen): ${idxs.length}/81 ${K - count}/${K}`)
      } else {
        count--
        console.log(`${new Date().toISOString()} Zoekstap (oplossing): ${idxs.length}/81 ${K - count}/${K}`)
      }
    }
  }

  console.log(`${new Date().toISOString()} Puzzel gevonden: ${result.filter(v => !v).length}/${K}`)
  return result
}

// API //
export const sudoku = {
  serialize: (b: board) => stringify(b.cells.map(c => c.value)),

  deserialize: (s: string) => (s || '').length !== BOARDSIZE ? getEmptyBoard() : ({
    cells: s.split('').map(c => ({
      value: c === '_' ? undefined : parseInt(c),
      options: [],
      frozen: false
    }))
  }),

  getEmptyBoard: getEmptyBoard,

  getDisplayBoard: (b: board) => (
    range(SIZE).map(
      i => b.cells.slice(i * SIZE, ((i + 1) * SIZE))
    )
  ),

  isValidValue: (b: board, row: number, column: number, value: number) =>
    isValidValue(b.cells.map(c => c.value), row, column, value),

  setCellValue: (b: board, row: number, column: number, newValue: number) => {
    const i = getCellIndex(row, column);
    const optidx = getRowIndexes(row).concat(getColumnIndexes(column)).concat(getBlockIndexes(row, column))
    return {
      cells: b.cells
        .map((oldCell, idx) => ({
          value: idx === i ? newValue : oldCell.value,
          options: optidx.includes(idx) ? oldCell.options.filter(o => o !== newValue) : oldCell.options,
          frozen: oldCell.frozen
        }))
    }
  },

  clearCellValue: (b: board, row: number, column: number) => {
    const i = getCellIndex(row, column);
    const nwCell = { ...b.cells[i], value: undefined }
    return { cells: b.cells.map((oldCell, idx) => idx === i ? nwCell : oldCell) }
  },

  addOption: (b: board, row: number, column: number, newOption: number) => {
    const i = getCellIndex(row, column);
    const nwOptions = [...b.cells[i].options].filter(o => o !== newOption).concat(newOption).sort()
    const nwCell = { ...b.cells[i], options: nwOptions }
    return { cells: b.cells.map((oldCell, idx) => idx === i ? nwCell : oldCell) }
  },

  clearOption: (b: board, row: number, column: number, newOption: number) => {
    const i = getCellIndex(row, column);
    const nwOptions = [...b.cells[i].options].filter(o => o !== newOption)
    const nwCell = { ...b.cells[i], options: nwOptions }
    return { cells: b.cells.map((oldCell, idx) => idx === i ? nwCell : oldCell) }
  },

  solve: (b: board, maxoplossingen: number = 1): string[] => solve(b.cells.map(c => c.value), maxoplossingen),

  freeze: (b: board) => ({
    cells: [].concat(b.cells)
      .map(c => ({ ...c, frozen: (c.value ? true : false) }))
  }),

  generate: (K: number): [board, string] => {
    console.log(`${new Date().toISOString()} Start genereren`)
    // find random solution
    const solution = getRandomSolution()
    console.log(`${new Date().toISOString()} Grid gevonden: ${stringify(solution)}`)

    // find order of punching
    const idxs = getShuffeledIndexes(solution, K)

    // punch the holes
    const puzzle = punchHoles(solution, K, idxs)
    
    // return result
    return [{
      cells: puzzle.map(c => ({
        value: c,
        options: [],
        frozen: c ? true : false
      }))
    }, solution.join('')]
  },

  getAllOptions(board: board) {
    const b = board.cells.map(c => c.value)
    return {
      cells: board.cells.map((c, i) => ({
        ...c,
        options: range(SIZE).reduce((o, v) => isValidOnIndex(b, i, v + 1) ? o.concat(v + 1) : o, [])
      }))
    }
  }
}
