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

const solve = (b: number[], K: number = 1, randomize: boolean = false) : string[] => {
  if (b.length !== BOARDSIZE) {
    return [] as string[]
  }

  let idx = -1
  if(randomize) {
    idx = (getRandomElement(b.map((v, i) => ({v, i})).filter(c => !c.v)) || {i: -1}).i
  } else {
    idx = b.findIndex(i => !i)
  }

  if (idx === -1) {
    return [stringify(b)]
  }

  const numbers = randomize ? shuffle(range(SIZE)) : range(SIZE)
  return numbers.reduce((ret, n) => {
    if ((ret.length < K) && isValidOnIndex(b, idx, n + 1)) {
      const nwB = [].concat(b)
      nwB[idx] = n + 1
      return ret.concat(solve(nwB, K))
    } else {
      return ret
    }
  }, [])
}

const generateFullBoard = () => {
  const numbers = range(SIZE)
    const board = getEmptyBoard()
    const b1 = shuffle(numbers)
    const b2 = shuffle(numbers)
    const b3 = shuffle(numbers)
    range(BLOCKSIZE).forEach(i => {
      range(BLOCKSIZE).forEach(j => {
        const k = i * BLOCKSIZE + j
        const ix1 = getCellIndex(i, j)
        const ix2 = getCellIndex(i + BLOCKSIZE, j + BLOCKSIZE)
        const ix3 = getCellIndex(i + BLOCKSIZE * 2, j + BLOCKSIZE * 2)
        board.cells[ix1].value = b1[k] + 1
        board.cells[ix2].value = b2[k] + 1
        board.cells[ix3].value = b3[k] + 1
      })
    })

    return solve(board.cells.map(c => c.value), 1, true)[0]
}

const getEmptyBoard = () => ({
  cells: range(BOARDSIZE)
    .map(n => ({
      value: undefined,
      options: [],
      frozen: false
    }))
} as board)

const shuffle = (source: any[]) => source
  .map(v => ({ v, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ v }) => v)

const getRandomElement = (source: any[]) =>
  source[Math.floor(Math.random() * source.length)]

// API //
export const sudoku = {
  serialize: (b: board) => stringify(b.cells.map(c => c.value)),

  deserialize: (s: string) => s.length !== BOARDSIZE ? getEmptyBoard() : ({
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
    var result = generateFullBoard().split('').map(c => c === '_' ? undefined : parseInt(c))
    var solution = result

    var count = K
    while (count > 0) {
      var numSol = 0
      var maxTries = 10
      while (numSol !== 1) {
        const idx = getRandomElement(result.map((v, i) => v ? i : -1).filter(i => i !== -1))
        const optie = [].concat(result)
        optie[idx] = undefined
        numSol = solve(optie, 2).length
        if (numSol === 1) {
          result = optie
        }
        maxTries--
        if (maxTries < 1) {
          return [{
            cells: result.map(c => ({
              value: c,
              options: [],
              frozen: c ? true : false
            }))
          }, solution.join('')]
        }
      }
      count--
    }

    return [{
      cells: result.map(c => ({
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
