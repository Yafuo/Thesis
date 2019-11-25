import {NgModule} from "@angular/core";
import {HomeComponent} from "./home.component";
import {HomeRoutingModule} from "./home-routing.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {BsDropdownModule} from "ngx-bootstrap";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    HomeRoutingModule,
    FontAwesomeModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    BsDropdownModule.forRoot()
  ],
  providers: []
})
export class HomeModule {

}
