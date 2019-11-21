import { Component, OnInit } from '@angular/core';
import { faBars} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit {

  farBars = faBars;
  constructor() { }

  ngOnInit() {
  }

}
