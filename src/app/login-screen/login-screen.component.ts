import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {
animationIsFinished = false;
switch_expression: any = "login";
profileImages: any = ["1","2","3","4","5","6"];
email: string = "";
password: string = "";





login = new FormGroup({
  email:new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required] ),
});


addUser = new FormGroup({
  email:new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required] ),
});


  getErrorMessage() {
    let emailControl = this.login.get('email');
    if (emailControl?.hasError('email')) {
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


     changeSwitchCase(newSwitchCase:string) {
      this.switch_expression = newSwitchCase;
     }

}
 



