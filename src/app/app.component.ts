import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { scan, tap } from 'rxjs/operators';
import { BLOCKSIZE, board, cell, SIZE, sudoku } from './sudoku'

type viewState = {
  board: board,
  size: number,
  blocksize: number,
  displayBoard: cell[][],
  solution_string: string,
  solution: cell[][],
  check_solution: boolean,
  create_message: string,
  solve_message: string
}

type updateAction = (vm: viewState) => Partial<viewState>

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public vm$: Observable<viewState>
  public vm: viewState
  public updateVm = new Subject<updateAction>()
  public subscription = new Subscription()
  public level = 35
  public levelOptions = [
    { name: "Makkie", value: 62 },
    { name: "Leuk", value: 53 },
    { name: "Te doen", value: 44 },
    { name: "Wordt moeilijk", value: 35 },
    { name: "Best lastig", value: 26 },
    { name: "Onmenselijk", value: 17 }
  ];

  constructor() {
    this.vm$ = this.updateVm.pipe(
      scan((state, action) => {
        const resets = {check_solution: false, create_message: undefined, solve_message: undefined}
        const nwState = { ...state, ...resets , ...action(state) }
        return { ...nwState, displayBoard: sudoku.getDisplayBoard(nwState.board) }
      }, {
        board: undefined,
        size: SIZE,
        blocksize: BLOCKSIZE,
        displayBoard: undefined,
        solution_string: undefined,
        solution: undefined,
        check_solution: false,
        create_message: undefined, 
        solve_message: undefined
      }),
      tap(console.log)
    )
  }

  ngOnInit(): void {
    this.subscription.add(
      this.vm$.subscribe(
        _vm => { this.vm = _vm }
      )
    )

    this.updateVm.next((vm: viewState) => ({ board: sudoku.getEmptyBoard() }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  setValue(r: number, c: number, n: number) {
    this.updateVm.next((s: viewState) => {
      if (sudoku.isValidValue(s.board, r, c, n)) {
        return { board: sudoku.setCellValue(s.board, r, c, n) }
      } else {
        return {}
      }
    })
  }

  clearValue(r: number, c: number, n: number) {
    this.updateVm.next((s: viewState) => ({ board: sudoku.clearCellValue(s.board, r, c) }))
  }

  setOption(r: number, c: number, n: number) {
    this.updateVm.next((s: viewState) => ({ board: sudoku.addOption(s.board, r, c, n) }))
  }

  clearOption(r: number, c: number, n: number) {
    this.updateVm.next((s: viewState) => ({ board: sudoku.clearOption(s.board, r, c, n) }))
  }

  empty() {
    this.updateVm.next((_: viewState) => ({
      board: sudoku.getEmptyBoard(),
      solution: undefined,
      solution_string: undefined
    }));
  }

  solve() {
    this.updateVm.next((s: viewState) => {
      if (!s.solution_string) {
        return {}
      }

      const nwBoard = sudoku.deserialize(s.solution_string)
      nwBoard.cells = nwBoard.cells.map((c, i) => ({ ...c, frozen: s.board.cells[i].frozen }))
      return {
        board: nwBoard,
      }
    })
  }

  hint() {
    this.updateVm.next((s: viewState) => {
      if (!s.solution_string) {
        return {
          solve_message: 'Geen oplossing voor deze sudoku'
        }
      }

      const nwBoard = sudoku.deserialize(s.solution_string)
      const emptyIdxs = s.board.cells.map((v, i) => ({v: v.value, i})).filter(c => !c.v).map(({i}) => i)
      if(emptyIdxs.length > 0) {
        const emptyIdx = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)]
        const hint = nwBoard.cells[emptyIdx].value
        var board = {cells: [].concat(s.board.cells)}
        board.cells[emptyIdx].value = hint

        return {
          board
        }
      } else {
        return {
          solve_message: 'Geen hint gevonden'
        }
      }
    })
  }

  check() {
    this.updateVm.next((s: viewState) => {
      const solutions = sudoku.solve(s.board, 2)
      if (solutions.length > 1) {
        return {
          create_message: 'Meer dan 1 oplossing gevonden'
        }
      } else if (solutions.length === 0) {
        return {
          create_message: 'Geen dan 1 oplossing gevonden'
        }
      }
      return {
        board: sudoku.freeze(s.board),
        solution: sudoku.getDisplayBoard(sudoku.deserialize(solutions[0])),
        solution_string: solutions[0]
      }
    })
  }

  checkSolution() {
    this.updateVm.next((s: viewState) => {
      if (!s.solution_string) {
        return {
          solve_message: 'Geen oplossing voor deze sudoku'
        }
      }

      return {
        check_solution: true
      }
    })
  }

  getString() {
    this.updateVm.next((s: viewState) => {
      return {
        create_message: sudoku.serialize(s.board)
      }
    })
  }

  setString() {
    const s = prompt('Type de string voor het bord')
    this.updateVm.next((_: viewState) => ({ board: sudoku.deserialize(s) }))
  }

  generate() {
    const _timestamp = new Date()
    this.updateVm.next((_: viewState) => ({
      board: sudoku.getEmptyBoard(),
      create_message: `Er wordt een puzzel gemaakt. Doel is ${81 - this.level} lege vakjes.`
    }))
    const [board, solution] = sudoku.generate(81 - this.level)
    const solution_cells = sudoku.getDisplayBoard(sudoku.deserialize(solution))

    this.updateVm.next((_: viewState) => ({
      board,
      solution: solution_cells,
      solution_string: solution,
      create_message: `Er is een puzzle gevonden met. Met ${board.cells.filter(c => !c.value).length} 
        lege vakjes van de ${81 - this.level} gevraagde. 
        Tijdsduur ${new Date((new Date()).getTime() - _timestamp.getTime()).toISOString().replace('1970-01-01T','')}`
    }));
  }

  alloptions() {
    this.updateVm.next((s: viewState) => ({
      board: sudoku.getAllOptions(s.board)
    }))
  }
}
