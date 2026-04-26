import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoDestino } from './nuevo-destino';

describe('NuevoDestino', () => {
  let component: NuevoDestino;
  let fixture: ComponentFixture<NuevoDestino>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoDestino]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevoDestino);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
