// CONST EN TYPES
export const SIZE = 9
export const BLOCKSIZE = 3

export type cell = {
  value: number;
  options: number[]
}

export type board = {
  cells: cell[]
}

// PRIVATE HELPER FUNCTIONS //
const isValidInRow = (b: board, row: number, value: number) => 
  b.cells
    .slice(row * SIZE, ((row + 1) * SIZE))
    .reduce((a, c) => a && (c.value !== value), true)

const isValidInColumn = (b: board, column: number, value: number) => 
  [...Array(SIZE).keys()].reduce((a, i) => a && (b.cells[(i * SIZE) + column].value !== value), true)

const isValidInBlock = (b: board, row: number, column: number, value: number) => {
  const fstRow = Math.floor(row / BLOCKSIZE) * BLOCKSIZE
  const fstCol = Math.floor(column / BLOCKSIZE) * BLOCKSIZE
  const it = [...Array(BLOCKSIZE).keys()]
  const idx = it.map(i => i + fstRow).flatMap(r => it.map(i => r * 9 + i + fstCol))
  return idx.reduce((a,i) => a && (b.cells[i].value !== value), true)
}

const isValidValue = (b: board, row: number, column: number, value: number) => 
  isValidInColumn(b, column, value) && isValidInRow(b, row, value) && isValidInBlock(b, row, column, value)

// EXPORT FUNCTIONS //
export const sudoku = {
  getEmptyBoard: () => ({
    cells: [...Array(SIZE * SIZE).keys()]
      .map(n => ({
        value: undefined,
        options: []
      }))
  } as board),

  getDisplayBoard: (b: board) => (
    [...Array(SIZE).keys()].map(
      i => b.cells.slice(i * SIZE, ((i + 1) * SIZE))
    )
  ),

  isValidValue: isValidValue,

  setCellValue: (b: board, row: number, column: number, newValue: number) => {
    const i = row * SIZE + column;
    const nwCell = { ...b.cells[i], value: newValue }
    return {cells: b.cells.map((oldCell,idx) => idx === i ? nwCell : oldCell)}
  },

  clearCellValue: (b: board, row: number, column: number) => {
    const i = row * SIZE + column;
    const nwCell = { ...b.cells[i], value: undefined }
    return {cells: b.cells.map((oldCell,idx) => idx === i ? nwCell : oldCell)}
  },

  addOption: (b: board, row: number, column: number, newOption: number) => {
    const i = row * SIZE + column;
    const nwOptions = [...b.cells[i].options].filter(o => o !== newOption).concat(newOption).sort()
    const nwCell = { ...b.cells[i], options: nwOptions }
    return {cells: b.cells.map((oldCell,idx) => idx === i ? nwCell : oldCell)}
  },

  clearOption: (b: board, row: number, column: number, newOption: number) => {
    const i = row * SIZE + column;
    const nwOptions = [...b.cells[i].options].filter(o => o !== newOption)
    const nwCell = { ...b.cells[i], options: nwOptions }
    return {cells: b.cells.map((oldCell,idx) => idx === i ? nwCell : oldCell)}
  }
}
