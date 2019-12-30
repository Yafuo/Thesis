import { Component, OnInit } from '@angular/core';
import {faBars, faArrowLeft, faChevronLeft,faSignInAlt,faLanguage} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CookieService} from "ngx-cookie-service";
import {TranslateService} from "@ngx-translate/core";
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  url = ['/landing/login', '#'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  faChevronLeft = faChevronLeft;
  faSignInAlt = faSignInAlt;
  faLanguage = faLanguage;
  navBarList = [this.faSignInAlt, this.faLanguage];
  selectedLang = '';
  langList = [{name: 'Vietnamese', code: 'vn'}, {name: 'English', code: 'en'}, {name: 'Español', code: 'es'}, {name: 'Chinese', code: 'ch'}];
  list = [{opt: 'Sign in', details: []}, {opt: 'Language', details: this.langList}];
  user = new User('', '', '');
  constructor(private http: HttpClient, private translate: TranslateService, private router: Router, private spinner: NgxSpinnerService, private cookieService: CookieService) { }

  ngOnInit() {
    if (this.cookieService.check('token')) {
      this.router.navigate(['/home']);
    } else {
      this.spinner.show();

      setTimeout(() => {
        this.spinner.hide();
      }, 600);
    }
  }

  signup() {
    const params = {
      email: this.user.email,
      password: this.user.password,
      lang: this.selectedLang ? this.selectedLang : 'vn'
    };
    this.http.post('/api/signup', params).subscribe(r => {
      console.log(r);
    }, err => {
      console.log(err);
    });
  }

  navTo(i: number) {
    if (i + 1 === this.list.length) return;
    this.router.navigate([this.url[i]]);
  }

  private _setLang(lang: string) {
    this.translate.setDefaultLang(lang);
    this.selectedLang = lang;
  }

}
export class User {
  email: string;
  password: string;
  confirm: string;
  constructor(email: string, password: string, confirm: string) {
    this.email = email;
    this.password = password;
    this.confirm = confirm;
  }
}
