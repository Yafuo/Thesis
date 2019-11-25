import { Component, OnInit } from '@angular/core';
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {BsDropdownConfig} from "ngx-bootstrap";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  faChevronDown = faChevronDown;
  districtList = ['TAN-PHU', 'TAN-BINH', 'PHU-NHUAN', 'BINH-THANH'];
  selectedDistrict = 'BINH-THANH';
  constructor(private translate: TranslateService) { }

  ngOnInit() {
  }

}
