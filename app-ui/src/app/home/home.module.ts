import {NgModule} from "@angular/core";
import {HomeComponent} from "./home.component";
import {HomeRoutingModule} from "./home-routing.module";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
import {BsDropdownModule} from "ngx-bootstrap";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TranslateModule} from "@ngx-translate/core";
import {
  MatCheckboxModule, MatSidenavModule, MatListModule
  , MatInputModule, MatIconModule, MatAutocompleteModule, MatButtonModule, MatCardModule, MatExpansionModule
} from "@angular/material";
import {MatRadioModule} from "@angular/material/radio";
import {OwlDateTimeModule, OwlNativeDateTimeModule} from "ng-pick-datetime";

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
    MatInputModule,
    BsDropdownModule.forRoot(),
    TranslateModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatRadioModule,
    MatExpansionModule,
    ReactiveFormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule
  ],
  providers: []
})
export class HomeModule {

}
