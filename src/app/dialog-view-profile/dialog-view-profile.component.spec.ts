import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogViewProfileComponent } from './dialog-view-profile.component';

describe('DialogViewProfileComponent', () => {
  let component: DialogViewProfileComponent;
  let fixture: ComponentFixture<DialogViewProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogViewProfileComponent]
    });
    fixture = TestBed.createComponent(DialogViewProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
