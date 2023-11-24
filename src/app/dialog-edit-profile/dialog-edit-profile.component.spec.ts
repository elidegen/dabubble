import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEditProfileComponent } from './dialog-edit-profile.component';

describe('DialogEditProfileComponent', () => {
  let component: DialogEditProfileComponent;
  let fixture: ComponentFixture<DialogEditProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogEditProfileComponent]
    });
    fixture = TestBed.createComponent(DialogEditProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
