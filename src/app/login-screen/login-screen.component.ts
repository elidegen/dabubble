import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {
animationIsFinished = false;


  ngOnInit() {
    this.hideContentAfterAnimation();

  }


 



  hideContentAfterAnimation() {
    setTimeout(() => {
   this.animationIsFinished = true;
    }, 2500);
     }

}
 



