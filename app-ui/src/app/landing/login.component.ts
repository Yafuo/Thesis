import {Component, OnInit} from '@angular/core';
import {faBars, faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {User} from "./signup/signup.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  list = ['Sign Up', 'Exit'];
  faBars = faBars;
  faArrowLeft = faArrowLeft;
  faGithub = faGithub;
  user = new User('mrphu97@gmail.com', '1234qwer', '1234qwer');
  constructor() { }

  ngOnInit() {
  }

  signin(email: string, password: string) {
    console.log(email + '\n' + password);
  }

}
