import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from 'src/models/user.class';
import { FirestoreService } from '../firestore.service';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss','./login-screen-mediaquery.scss']
})
export class LoginScreenComponent implements OnInit {
  animationIsFinished = false;
  picSrc = "assets/img/avatars/profile.svg";
  switch_expression: any = "login";
  profileImages: any = ["assets/img/avatars/character_1.svg", "assets/img/avatars/character_2.svg", "assets/img/avatars/character_3.svg", "assets/img/avatars/character_4.svg", "assets/img/avatars/character_5.svg", "assets/img/avatars/character_6.svg",]
  email: string = "";
  password: string = "";
  newUser: User = new User;
  resetEmail: string = "";
  uploadFile: string = "";
  userNotFound: any;
  resetEmailNotFound: boolean = false;
  userAlreadyInUse: boolean = false;
 showUserCreatedSuccess = false;
 showEmailSent = false;


  ngOnInit() {
    this.hideContentAfterAnimation();
  }

  constructor(public userService: UserService, public router: Router, public authService: AuthService, public firestoreService: FirestoreService) { }

  getEmailForNewPassword = new FormGroup({
    emailForReset: new FormControl('', [Validators.required, Validators.email]),
  });

  login = new FormGroup({
    loginemail: new FormControl('', [Validators.required, Validators.email]),
    loginpassword: new FormControl('', [Validators.required]),
  });

  addUser = new FormGroup({
    newName: new FormControl('', [Validators.required, Validators.minLength(5)]),
    newEmail: new FormControl('', [Validators.required, Validators.email]),
    newPassword: new FormControl('', [Validators.required]),
    disableSelect: new FormControl(false),
  });

  get newName() {
    return this.addUser.get('newName') as FormControl;
  }

  get newEmail() {
    return this.addUser.get('newEmail') as FormControl;
  }

  get newPassword() {
    return this.addUser.get('newPassword') as FormControl;
  }

  get loginemail() {
    return this.login.get('loginemail') as FormControl;
  }

  get emailForReset() {
    return this.getEmailForNewPassword.get('emailForReset') as FormControl;
  }

  get loginpassword() {
    return this.login.get('loginpassword') as FormControl;
  }

  get disableSelect() {
    return this.addUser.get("disableSelect") as FormControl;
  }

  getErrorMessageLogin() {
    if (this.loginemail?.hasError('email')) {
      return 'Not a valid email';
    }
    return "";
  }

  getErrorMessageReset() {
    if (this.emailForReset?.hasError('email')) {
      return 'Not a valid email';
    }
    return "";
  }

  getErrorMessageNewUser() {
    if (this.newName?.hasError('minlength')) {
      return 'Enter a user name with minimum 5 letters';
    }
    if (this.newName?.hasError('required')) {
      return 'Enter a user name with minimum 5 letters';
    }
    return "";
  }

  getErrorMessageNewEmail() {
    if (this.newEmail?.hasError('email')) {
      return 'Type in a valid e-mail';
    }
    return "";
  }

  getErrorMessageNewPassword() {
    if (this.newPassword?.hasError('minLenght')) {
      return 'You need a password with minium 6 letters';
    }
    return "";
  }

  getErrorMessageNoUser() {
    if (this.userNotFound) {
      return 'Wrong E-mail or password';
    } else {
      return "";
    }
  }

  changePicSrc(pic: string) {
    this.picSrc = pic;
  }


  /**
   * @method createUser
   * @description Asynchronously creates a new user using form data from the `addUser` FormGroup.
   * After attempting to create a user, it will navigate to the avatar selection or show an error if the user is already in use.
   */
  async createUser() {
    this.newUser.name = this.newName.value;
    this.newUser.email = this.newEmail.value;
    this.newUser.password = this.newPassword.value;
    this.userService.currentEmail = this.newEmail.value;
    this.userService.currentPassword = this.newPassword.value;
    console.log("User wird vorbereitet:", this.newUser);
    await this.authService.createUser();
    this.firestoreService.showSpinner = true;
    setTimeout(() => {
      if (this.userService.userIsAvailable) {
        this.changeSwitchCase('avatar');
        this.firestoreService.showSpinner = false;
      } else {
        this.userAlreadyInUse = true;
        this.firestoreService.showSpinner = false;
        setTimeout(() => {
          this.userAlreadyInUse = false;
        }, 3000);
      }
    }, 1500);
  }

/**
 * @method uploadUser
 * @description Uploads the new user data to the database.
 * Sets the profile picture and marks the user as online before adding them to the user service.
 * Signs in the user and displays a success message upon successful creation.
 */
  async uploadUser() {
    this.newUser.picture = this.picSrc;
    this.newUser.online = true;
    this.userService.addUser(this.newUser as User);
    this.authService.signInUser(this.userService.currentEmail, this.userService.currentPassword);
    this.showUserCreatedSuccess = true;
    setTimeout(() => {
      this.showUserCreatedSuccess = false;
    }, 1000);
  }

 /**
 * @method loginUser
 * @description Logs in a user with the provided email and password.
 * Calls the authentication service to sign in the user and handles both success and failure cases.
 * On success, a flag is set and on failure, an error message is displayed.
 */
  async loginUser() {
   await this.authService.signInUser(this.email, this.password);
    if (this.authService.signInSuccess) {
      this.authService.signInSuccess = true;
      this.userNotFound = false;
      setTimeout(() => {
        this.authService.signInSuccess = false;
        
      }, 1000);
    } else {
     
        this.authService.signInSuccess = false;
        this.userNotFound = true;
        this.getErrorMessageNoUser();
    }
  }


  /**
 * @method loginWithGoogle
 * @description Initiates the login process using Google authentication.
 * Calls the authentication service's `signInWithGoogle` method.
 */
  loginWithGoogle() {
    this.authService.signInWithGoogle();
  }



  /**
 * @method hideContentAfterAnimation
 * @description Hides certain content after a set animation duration.
 * Sets `animationIsFinished` to true after a delay, indicating that the animation has completed.
 */
  hideContentAfterAnimation() {
    setTimeout(() => {
      this.animationIsFinished = true;
    }, 2500);
  }


  /**
 * @method changeSwitchCase
 * @description Changes the current view or state based on a given switch case string.
 * @param {string} newSwitchCase - The new switch case value to update the component's state.
 */
  changeSwitchCase(newSwitchCase: string) {
    this.switch_expression = newSwitchCase;
  }

  /**
 * @method sendResetEmail
 * @description Sends a password reset email to the specified address.
 * Shows a confirmation message upon sending the email.
 */
  sendResetEmail() {
    this.authService.sendResetEmail(this.resetEmail);
    this.showEmailSent = true;
    setTimeout(() => {
      this.showEmailSent = false;
    }, 1000);
  }



  /**
 * @method onFileSelected
 * @description Handles the file selection event for uploading profile images.
 * Uploads the selected file using the authentication service and shows a spinner during the process.
 * @param {Event} event - The event object containing the selected file.
 */
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.authService.uploadProfileImage(file);
      this.firestoreService.showSpinner = true;
    }
    setTimeout(() => {
      this.picSrc = this.authService.customPic;
      this.firestoreService.showSpinner = false;
    }, 2500);
  }


  /**
 * @method checkIfUserExists
 * @description Checks if a user exists based on the provided email and password.
 * Sets the `userNotFound` flag depending on whether the user is found in the user service.
 */
  checkIfUserExists() {
    let userIndex = this.authService.findUserIndexWithEmail(this.email);
    if (userIndex !== -1 && this.userService.users[userIndex].password == this.password) {
      this.userNotFound == false
    } else {
      this.userNotFound = true;
    }
  }


  /**
 * @method loginGuest
 * @description Logs in a user as a guest.
 * Signs out any currently authenticated user, signs in as a guest, and navigates to the home page.
 */
  loginGuest() {
    this.authService.signOutUser();
    this.authService.signInGuest();
    this.authService.signInSuccess = true;
    setTimeout(() => {
      this.authService.signInSuccess = false;
      this.router.navigate(['home']);
    }, 1000);
  
  }
}