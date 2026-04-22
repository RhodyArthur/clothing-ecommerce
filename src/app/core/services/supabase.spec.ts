import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';

const supabaseHoisted = vi.hoisted(() => {
  return {
    createClientMock: vi.fn(),
    fakeClient: { marker: 'supabase-client' },
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseHoisted.createClientMock,
}));

import { Supabase } from './supabase';

describe('Supabase', () => {
  beforeEach(() => {
    supabaseHoisted.createClientMock.mockReset();
    supabaseHoisted.createClientMock.mockReturnValue(supabaseHoisted.fakeClient);

    TestBed.configureTestingModule({
      providers: [Supabase],
    });
  });

  it('creates the Supabase client from environment config', () => {
    const service = TestBed.inject(Supabase);

    expect(supabaseHoisted.createClientMock).toHaveBeenCalledWith(
      environment.supabase.url,
      environment.supabase.key,
    );
    expect(service.client).toBe(supabaseHoisted.fakeClient);
  });
});
