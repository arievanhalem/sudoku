import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { scan, tap } from 'rxjs/operators';
import { BLOCKSIZE, board, cell, SIZE, sudoku } from './sudoku'

type viewState = {
  board: board,
  size: number,
  blocksize: number,
  displayBoard: cell[][]
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

  constructor() {
    this.vm$ = this.updateVm.pipe(
      scan((state, action) => {
        const nwState = {...state, ...action(state)}
        return {...nwState, displayBoard: sudoku.getDisplayBoard(nwState.board) }
      }, {
        board: undefined,
        size: SIZE,
        blocksize: BLOCKSIZE,
        displayBoard: undefined
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
}
