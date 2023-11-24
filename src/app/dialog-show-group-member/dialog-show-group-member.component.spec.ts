import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogShowGroupMemberComponent } from './dialog-show-group-member.component';

describe('DialogShowGroupMemberComponent', () => {
  let component: DialogShowGroupMemberComponent;
  let fixture: ComponentFixture<DialogShowGroupMemberComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DialogShowGroupMemberComponent]
    });
    fixture = TestBed.createComponent(DialogShowGroupMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
