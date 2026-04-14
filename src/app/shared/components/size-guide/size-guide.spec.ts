import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SizeGuide } from './size-guide';

describe('SizeGuide', () => {
  let component: SizeGuide;
  let fixture: ComponentFixture<SizeGuide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SizeGuide],
    }).compileComponents();

    fixture = TestBed.createComponent(SizeGuide);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
