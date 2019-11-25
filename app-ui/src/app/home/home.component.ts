import { Component, OnInit } from '@angular/core';
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {BsDropdownConfig} from "ngx-bootstrap";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  faChevronDown = faChevronDown;
  districtList = ['Tan Phu', 'Tan Binh', 'Phu Nhuan', 'Binh Thanh'];
  selectedDistrict = 'Binh Thanh';
  constructor() { }

  ngOnInit() {
  }

}
