import {NgModule} from "@angular/core";
import {HomeComponent} from "./home.component";
import {HomeRoutingModule} from "./home-routing.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
import {TopPanelComponent} from "../common/top-panel/top-panel.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";

@NgModule({
  declarations: [
    HomeComponent,
    TopPanelComponent
  ],
  imports: [
    HomeRoutingModule,
    FontAwesomeModule,
    RouterModule,
    MatSidenavModule,
    MatListModule
  ],
  providers: []
})
export class HomeModule {

}
