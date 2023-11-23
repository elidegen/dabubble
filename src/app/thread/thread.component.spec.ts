import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadComponent } from './thread.component';

describe('ThreadComponent', () => {
  let component: ThreadComponent;
  let fixture: ComponentFixture<ThreadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThreadComponent]
    });
    fixture = TestBed.createComponent(ThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
