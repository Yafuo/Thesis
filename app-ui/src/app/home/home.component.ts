import {Component, OnInit, Renderer2, ViewEncapsulation} from '@angular/core';
import {faChevronDown, faSearch} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class HomeComponent implements OnInit {

  faChevronDown = faChevronDown;
  faSearch = faSearch;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  googleMapsList = ['10 Ho Dac Di, P.Tay Thanh, Q.Tan Phu', '22/44 CMT8, P.2, Q.Tan Binh',
    '49a Phan Dang Luu, P.7, Q.Phu Nhuan', '96 Le Quang Dinh, P.14, Q.Binh Thanh'];
  selectedDistrict = 'Tan Phu';
  myControl = new FormControl();
  filterList : Observable<string[]>;
  filterMapsList: Observable<string[]>;
  isFilterClicked = false;
  packageList = ['1 hour', '3 hour', '1 day'];
  height = '';
  state = 'down';
  arriveTime = new Date(Date.now());
  leaveHomeTime = new Date(Date.now());
  constructor(private translate: TranslateService, private render: Renderer2) { }

  ngOnInit() {
    this.districtList = this.districtList.map(d => this._getTranslation(d));
    this.filterList = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 1))
    );
    this.filterMapsList = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 2))
    );
  }

  private _filter(value: string, opt: number): string[] {
    const filterValue = value.toLowerCase();
    return opt === 1 ? this.districtList.filter(d => d.toLowerCase().indexOf(filterValue) > -1) : this.googleMapsList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
  }

  private _getTranslation(value: string) : string {
    let wordTranslated = 'not_ready';
    this.translate.get(`DISTRICT.${value}`).subscribe(word => {
      wordTranslated = word;
    });
    return wordTranslated;
  }

  private _checkValidTime(): boolean {
    console.log('Ten ten')
    if (this.arriveTime < this.leaveHomeTime) {
      return true;
    }
    return false;
  }

  toggleFilter() {
    this.isFilterClicked = !this.isFilterClicked;
  }

  display(stt: string) {
    // this.render.setStyle(document.body.getElementsByClassName('indicator'), 'transform', 'rotate(180deg)');
    this.state = this.state === 'down' ? 'up' :'down';
  }

}
