import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { GeneralDataService } from 'src/app/services/general-data.service';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss']
})


export class SearchInputComponent implements AfterViewInit {

  @ViewChild('queryInput') private _input : ElementRef;
  @Output() accepted = new EventEmitter<any>();
  @Output() queryChange = new EventEmitter<any>();
  @Output() focusChange = new EventEmitter<boolean>();

  protected _delay: number = 150;
  protected _focused: boolean = false;
  protected _inputTimer;
  protected _lastQuery: any;
  protected _loading: boolean = false;
  protected _query: any = {};

  constructor(
    private _renderer: Renderer2,
    private _dataService: GeneralDataService,
  ) {}

  get value(): any {
    return this._query;
  }

  set value(val: any) {
    this._query = val;
    if(this._input) this._input.nativeElement.value = val.term;
  }

  get focused() {
    return this._focused;
  }

  focus() {
    requestAnimationFrame(() => {
      if(this._input) this._input.nativeElement.select();
    });
  }

  get loading() {
    return this._loading;
  }

  @Input() set loading(val: boolean) {
    this._loading = val;
  }

  ngAfterViewInit() {
    if(! this._input) {
      console.error('search input element not found');
      return;
    }
    let input_elt = this._input.nativeElement;
    this._renderer.listen(input_elt, 'focus', (event) => {
      this._focused = true;
      this.focusChange.emit(this._focused);
    });
    this._renderer.listen(input_elt, 'blur', (event) => {
      this._focused = false;
      this.focusChange.emit(this._focused);
    });
    this._renderer.listen(input_elt, 'input', (event) => {
      this.updateQuery(event.target.value, true);
    });
    this._renderer.listen(input_elt, 'change', (event) => {
      this.updateQuery(event.target.value);
    });
    this._renderer.listen(input_elt, 'keydown', (event) => {
      if(event.keyCode === 13) {
        event.preventDefault();
        this.acceptInput();
      }
    });
  }

  protected acceptInput() {
    this.accepted.emit(null);
  }

  protected updateQuery(value: any, live?: boolean) {
    let old = this._lastQuery;
    if(value === undefined || value === null) {
      value = {};
    }
    this._query = value;
    if(old !== value) {
      clearTimeout(this._inputTimer);
      if(live) {
        this._inputTimer = setTimeout(this.updated.bind(this), this._delay);
      } else {
        this.updated();
      }
    }
  }

  protected updated() {
    if(this._lastQuery !== this._query) {
      this._lastQuery = this._query;
      this.queryChange.emit(this._lastQuery);
    }
  }

  get typeaheadSearch() {
    return (text$: Observable<string>) => {
      return text$.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(term => this._dataService.autocomplete(term))
      );
    }
  }

  typeaheadSelected(evt) {
    evt.preventDefault();
    let val = evt.item;
    this.value = val;
    this.updateQuery(val);
    this.acceptInput();
  }

  formatter (x: any) {
    return x.term;
  }
}
