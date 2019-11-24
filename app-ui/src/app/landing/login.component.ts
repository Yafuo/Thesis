import {Component, OnInit} from '@angular/core';
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {User} from "./signup/signup.component";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {CookieService} from "ngx-cookie-service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  list = ['Sign Up', 'Exit'];
  url = ['/landing/signup', '#'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  user = new User('', '', '');
  constructor(private http: HttpClient, private router: Router, private spinner: NgxSpinnerService, private cookieService: CookieService) { }

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
      console.log(r);
      this.router.navigate(['/home']);
    }, (err) => {
      console.log(err);
    });
  }

  navTo(i: number) {
    this.router.navigate([this.url[i]]);
  }

}
