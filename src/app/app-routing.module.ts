import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { DialogViewProfileComponent } from './dialog-view-profile/dialog-view-profile.component';
import { ImprintComponent } from './imprint/imprint.component';
import { PrivacyComponent } from './privacy/privacy.component';

const routes: Routes = [
  { path: '', component: LoginScreenComponent },
  { path: 'home', component: HomeComponent },
  { path: 'profile', component: DialogViewProfileComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy', component: PrivacyComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }