import {Component, OnInit} from '@angular/core';
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {User} from "./signup/signup.component";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";

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
  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
  }

  signin() {
    const params = {
      email: this.user.email,
      password: this.user.password
    }
    this.http.post('/login', params).subscribe(r => {
      console.log(r);
    }, (err) => {
      console.log(err);
    });
  }

  navTo(i: number) {
    this.router.navigate([this.url[i]]);
  }

}
