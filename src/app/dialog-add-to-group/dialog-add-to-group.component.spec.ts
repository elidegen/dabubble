import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddToGroupComponent } from './dialog-add-to-group.component';

describe('DialogAddToGroupComponent', () => {
  let component: DialogAddToGroupComponent;
  let fixture: ComponentFixture<DialogAddToGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogAddToGroupComponent]
    });
    fixture = TestBed.createComponent(DialogAddToGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
