import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserData } from '../interfaces/user-interface';
import { UserService } from '../user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {
  animationIsFinished = false;
  picSrc = "profile.svg";
  switch_expression: any = "login";
  profileImages: any = ["1", "2", "3", "4", "5", "6"];
  email: string = "";
  password: string = "";
  newUser: UserData;
  




  constructor(public userService: UserService, public router: Router) {
    this.newUser = {
      name: "",
      email: "",
      password: "",
      picture: "",
      id: ""
    };
  }


login = new FormGroup({
  loginemail: new FormControl('', [Validators.required, Validators.email]),
  loginpassword: new FormControl('', [Validators.required] ),
});


addUser = new FormGroup({
  newName: new FormControl('', [Validators.required] ),
  newEmail:new FormControl('', [Validators.required, Validators.email]),
  newPassword: new FormControl('', [Validators.required] ),
  disableSelect : new FormControl(false),
});


get newName() {
  return  this.addUser.get('newName') as FormControl;
}


get newEmail() {
  return  this.addUser.get('newEmail') as FormControl;
}
get newPassword() {
  return  this.addUser.get('newPassword') as FormControl;
}
get loginemail() {
  return  this.login.get('loginemail') as FormControl;
}

  get loginpassword() {
    return this.login.get('loginpassword') as FormControl;
  }

  get disableSelect() {
    return this.addUser.get("disableSelect") as FormControl;
  }


  getErrorMessage(){
    if (this.loginemail?.hasError('email')) {
      return 'Not a valid email';
    }
    return "";
  }

  getNewErrorMessage() {
    if (this.newEmail?.hasError('email')) {
      return 'Not a valid email';
    }
    return "";
  }


  

  ngOnInit() {
   
    this.hideContentAfterAnimation();
  }

  changePicSrc(pic:string) {
    this.picSrc = "character_" + pic +".svg";
    
  }

  createUser() {
    let newUser: UserData = {
      name: "",
      email: "",
      password: "",
      id: "",
      picture: this.picSrc,
    }
    newUser.name = this.newName.value;
    newUser.password = this.newPassword.value;
    newUser.email = this.newEmail.value;
    this.newUser = newUser;
    console.log("User wird vorbereitet:", newUser);
    this.changeSwitchCase('avatar');
  }

  uploadUser() {
      this.newUser.picture = this.picSrc;
  this.userService.addUser(this.newUser as UserData);
this.router.navigate(['home']);
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
 



