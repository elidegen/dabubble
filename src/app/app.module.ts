import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginScreenComponent } from './login-screen/login-screen.component';
import { HomeComponent } from './home/home.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkspaceComponent } from './workspace/workspace.component';
import { MainChatComponent } from './main-chat/main-chat.component';
import { ThreadComponent } from './thread/thread.component';
import {MatExpansionModule} from '@angular/material/expansion';
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogViewProfileComponent } from './dialog-view-profile/dialog-view-profile.component';
import { DialogAddChannelComponent } from './dialog-add-channel/dialog-add-channel.component';
import { DialogAddToGroupComponent } from './dialog-add-to-group/dialog-add-to-group.component';
import { DialogShowGroupMemberComponent } from './dialog-show-group-member/dialog-show-group-member.component';
import { FormsModule } from '@angular/forms';
import { ImprintComponent } from './imprint/imprint.component';
import { DirectMessageChatComponent } from './direct-message-chat/direct-message-chat.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { PrivacyComponent } from './privacy/privacy.component';








@NgModule({
  declarations: [
    AppComponent,
    LoginScreenComponent,
    HomeComponent,
    WorkspaceComponent,
    MainChatComponent,
    ThreadComponent,
    DialogEditChannelComponent,
    DialogViewProfileComponent,
    DialogAddChannelComponent,
    DialogAddToGroupComponent,
    DialogShowGroupMemberComponent,
    ImprintComponent,
    DirectMessageChatComponent,
    PrivacyComponent,
  ],
  imports: [
    BrowserModule,
    MatIconModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatRadioModule,
    AppRoutingModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    FormsModule,
    MatSliderModule,
    MatSelectModule,
    MatExpansionModule,
    ReactiveFormsModule,
    PickerComponent,
    // provideFirebaseApp(() => initializeApp({ "projectId": "dabubble-c4b96", "appId":
    //  "1:390532295885:web:ad6cd75380acc256d50d84", "storageBucket": "dabubble-c4b96.appspot.com", "apiKey": "AIzaSyAEu4ozPAp4fPV6zGVHoY_x9YT8wbZrMs4", 
    //  "authDomain": "dabubble-c4b96.firebaseapp.com", "messagingSenderId": "390532295885" })),
    // provideFirestore(() => getFirestore()),
  
    provideFirebaseApp(() => initializeApp({ 
      "projectId": "dabubble-dec6e", 
    "appId": "1:260526664736:web:1646199aec6fed465aa045", 
    "storageBucket": "dabubble-dec6e.appspot.com", 
    "apiKey": "AIzaSyA9gpqSDb0Sd0ZgwkB81Q6EPZ-Om-nPpbQ",
     "authDomain": "dabubble-dec6e",
      "messagingSenderId": "260526664736" })),
    provideFirestore(() => getFirestore()),


  
   
    
  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
