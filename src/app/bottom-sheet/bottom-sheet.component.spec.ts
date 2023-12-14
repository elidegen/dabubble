import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheet } from './bottom-sheet.component';

describe('BottomSheetComponent', () => {
  let component: BottomSheet;
  let fixture: ComponentFixture<BottomSheet>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BottomSheet]
    });
    fixture = TestBed.createComponent(BottomSheet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
