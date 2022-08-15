import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { cell } from '../sudoku';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent implements OnInit {
  public _info: cell
  public _options = {}
  public _check_solutino = false
  public _solution: number = undefined
  public _is_wrong = false

  @Input() set info(value:cell) {
    this._info = value;
    this._options = this._info.options.reduce((a, v) => ({ ...a, [v]: v}), {}) 
  }
  @Input() set check_solution(value: boolean) {
    this._check_solutino = true
    this._is_wrong = this._check_solutino && this._info.value && this._solution && (this._info.value !== this._solution) ? true : false
  }

  @Input() set solution (value: number) {
    this._solution = value
    this._is_wrong = this._check_solutino && this._info.value && this._solution && (this._info.value !== this._solution) ? true : false
  }

  @Output() setValue = new EventEmitter<number>();
  @Output() clearValue = new EventEmitter<number>();
  @Output() setOption = new EventEmitter<number>();
  @Output() clearOption = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  setvalue(n: number) {
    if(this._info.frozen) {
      return
    }

    if(this._info.value === n) {
      this.clearValue.emit(n)
    } else {
      this.setValue.emit(n)
    }
  }

  setoption(n: number, e: Event) {
    if(this._info.frozen) {
      return
    }

    e.preventDefault()
    if(this._options[n]) {
      this.clearOption.emit(n)
    } else {
      this.setOption.emit(n)
    }
  }
}
