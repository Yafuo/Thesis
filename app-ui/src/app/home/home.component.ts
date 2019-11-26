import { Component, OnInit } from '@angular/core';
import { faChevronDown, faSearch } from "@fortawesome/free-solid-svg-icons";
import {BsDropdownConfig} from "ngx-bootstrap";
import {TranslateService} from "@ngx-translate/core";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs";
import {map, startWith} from "rxjs/operators";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  faChevronDown = faChevronDown;
  faSearch = faSearch;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  selectedDistrict = 'Tan Phu';
  myControl = new FormControl();
  filterList : Observable<string[]>;
  constructor(private translate: TranslateService) { }

  ngOnInit() {
    this.districtList.map(d => d = this._getTranslation(d));
    console.log(this.districtList);
    this.filterList = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.districtList.filter(d => d.toLowerCase().indexOf(filterValue) > -1);
  }

  private _getTranslation(value: string) : string {
    console.log('delay');
    let wordTranslated = 'not_ready';
    this.translate.get(`DISTRICT.${value}`).subscribe(word => {
      wordTranslated = word;
    });
    return wordTranslated;
  }

}
