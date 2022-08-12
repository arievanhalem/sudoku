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
  @Input() set info(value:cell) {
    this._info = value;
    this._options = this._info.options.reduce((a, v) => ({ ...a, [v]: v}), {}) 
  }

  @Output() setValue = new EventEmitter<number>();
  @Output() clearValue = new EventEmitter<number>();
  @Output() setOption = new EventEmitter<number>();
  @Output() clearOption = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  setvalue(n: number) {
    if(this._info.value === n) {
      this.clearValue.emit(n)
    } else {
      this.setValue.emit(n)
    }
  }

  setoption(n: number, e: Event) {
    e.preventDefault()
    if(this._options[n]) {
      this.clearOption.emit(n)
    } else {
      this.setOption.emit(n)
    }
  }
}
