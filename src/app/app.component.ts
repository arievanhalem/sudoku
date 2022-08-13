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
  solution: cell[][]
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
        const nwState = { ...state, ...action(state) }
        return { ...nwState, displayBoard: sudoku.getDisplayBoard(nwState.board) }
      }, {
        board: undefined,
        size: SIZE,
        blocksize: BLOCKSIZE,
        displayBoard: undefined,
        solution_string: undefined,
        solution: undefined
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
      var solution: string
      if (!s.solution_string) {
        const solutions = sudoku.solve(s.board)
        if (solutions.length > 1) {
          console.log('Meer dan 1 oplossing')
          console.log(solutions)
        } else if (solutions.length === 0) {
          console.log('Geen oplossing')
          return {}
        }
        solution = solutions[0]
      } else {
        solution = s.solution_string
      }

      const nwBoard = sudoku.deserialize(solution)
      nwBoard.cells = nwBoard.cells.map((c, i) => ({ ...c, frozen: s.board.cells[i].frozen }))
      return {
        board: nwBoard,
        solution: sudoku.getDisplayBoard(sudoku.deserialize(solution))
      }

    })
  }

  check() {
    this.updateVm.next((s: viewState) => {
      const solutions = sudoku.solve(s.board)
      if (solutions.length > 1) {
        console.log('Meer dan 1 oplossing')
        console.log(solutions)
        return {}
      } else if (solutions.length === 0) {
        console.log('Geen oplossing')
        return {}
      }
      console.log('Geldige puzzel')
      return {
        board: sudoku.freeze(s.board),
        solution: sudoku.getDisplayBoard(sudoku.deserialize(solutions[0])),
        solution_string: solutions[0]
      }
    })
  }

  getString(b: board) {
    console.log(sudoku.serialize(b))
  }

  setString() {
    const s = prompt('Type de string voor het bord')
    this.updateVm.next((_: viewState) => ({ board: sudoku.deserialize(s) }))
  }

  generate() {
    var board = sudoku.generate(81 - this.level)
    const solutions = sudoku.solve(board)
    var solution: cell[][] = undefined
    var solution_string: string = undefined
    if (solutions.length === 0) {
      board = sudoku.getEmptyBoard()
    } else {
      solution_string = solutions[0]
      solution = sudoku.getDisplayBoard(sudoku.deserialize(solutions[0]))
      board = sudoku.freeze(board)
    }

    this.updateVm.next((_: viewState) => ({
      board,
      solution,
      solution_string
    }));
  }

  alloptions() {
    this.updateVm.next((s: viewState) => ({
      board: sudoku.getAllOptions(s.board)
    }))
  }
}
