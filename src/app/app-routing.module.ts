import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { DialogViewProfileComponent } from './dialog-view-profile/dialog-view-profile.component';

const routes: Routes = [
  {path: 'home',  component: HomeComponent},
  {path: '',  component: LoginScreenComponent},
  {path: 'profile',  component: DialogViewProfileComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
