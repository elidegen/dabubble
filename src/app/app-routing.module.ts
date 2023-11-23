import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginScreenComponent } from './login-screen/login-screen.component';

const routes: Routes = [
  {path: 'home',  component: HomeComponent},
  {path: '',  component: LoginScreenComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
