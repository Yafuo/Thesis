import {Component, OnInit} from '@angular/core';
import {faBars, faArrowLeft, faKey, faUser} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {User} from "./signup/signup.component";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CookieService} from "ngx-cookie-service";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  list = ['Sign Up', 'Exit'];
  url = ['/landing/signup', '#'];
  wrongList = ['WRONG_PASSWORD', 'WRONG_EMAIL'];
  wrongIndex = -1;
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  faKey = faKey;
  faUser = faUser;
  userIconList = [this.faKey, this.faUser];
  user = new User('', '', '');
  constructor(private translate: TranslateService, private http: HttpClient
              , private router: Router, private spinner: NgxSpinnerService, private cookieService: CookieService) {
    translate.setDefaultLang('en');
  }

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

  signin() {
    const params = {
      email: this.user.email,
      password: this.user.password
    }
    this.http.post('/api/login', params).subscribe(r => {
      const json = r as any;
      if (this.wrongList.indexOf(json.result)< 0){
        this.router.navigate(['/home']);
        return;
      }
      this.wrongIndex= this.wrongList.indexOf(json.result);
    });
  }

  navTo(i: number) {
    this.router.navigate([this.url[i]]);
  }

}
