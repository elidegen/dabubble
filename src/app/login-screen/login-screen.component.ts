import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {
animationIsFinished = false;

login = new FormGroup({
  email:new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required] ),
});



  getErrorMessage() {
    let emailControl = this.login.get('email');
    if (emailControl?.hasError('required')) {
      return 'You must enter a value';
    }

    return emailControl?.hasError('email') ? 'Not a valid email' : '';
  }

  ngOnInit() {
    this.hideContentAfterAnimation();

  }


 
  hideContentAfterAnimation() {
    setTimeout(() => {
   this.animationIsFinished = true;
    }, 2500);
     }

     onSubmit() {

     }

}
 



