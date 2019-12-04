import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgxSpinnerService} from "ngx-spinner";
import {
  faBars,
  faArrowLeft,
  faCheckCircle,
  faUserPlus,
  faSignInAlt,
  faPowerOff
} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {switchMap} from "rxjs/operators";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {

  private sub: any;
  list = ['Sign up', 'Login'];
  url = ['/landing/signup', '/landing/login'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  faCheckCircle = faCheckCircle;
  faUserPlus = faUserPlus;
  faSignInAlt = faSignInAlt;
  mail= '';
  encryptedEmail = '';
  password = '';
  isKnownEmail = false;
  isSent= false;
  isChanged=  false;
  navBarList = [this.faUserPlus, this.faSignInAlt];
  langList = ['Vietnamese', 'English', 'Español', 'Chinese'];
  faPowerOff = faPowerOff;
  constructor(private http: HttpClient, private spinner: NgxSpinnerService, private router: Router,
              private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.encryptedEmail = this.activeRoute.snapshot.queryParams['email'];
    this.isKnownEmail = this.encryptedEmail.indexOf('unknown') < 0;
    this.spinner.show();

    setTimeout(() => {
      this.spinner.hide();
    }, 600);
  }

  ngOnDestroy() {
    // this.sub.unsubscribe();
  }

  sendMail() {
    const params = {
      receiverMail: this.mail,
      plainContent: 'Please, click the link below to reset your password!\n'
    };
    this.http.post('/api/reset-password', params).subscribe(r => {
      console.log(r);
      // r is Object.
      // So we need to convert it to type any.
      const json = r as any;
      this.isSent = json.result.indexOf('SENT_SUCCESS') > -1;
    });
  }

  sendPass() {
    const params = {
      encryptedEmail: this.encryptedEmail,
      password: this.password
    };
    this.http.post('/api/reset-for', params).subscribe(r => {
      console.log(r);
      // r is Object.
      // So we need to convert it to type any.
      const json = r as any;
      this.isChanged = json.result.indexOf('PASSWORD_CHANGED_SUCCESS')> -1;
    });
  }

  navTo(i: number) {
    this.router.navigate([this.url[i]]);
  }

}
