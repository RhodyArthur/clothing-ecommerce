import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value ?? '').toString().trim();
  if (!value) return null; // let `required` handle empties
  const ok = /^\+?[0-9()\s-]{7,20}$/.test(value);
  return ok ? null : { invalidPhone: true };
};

export const passwordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '').toString();
  if (!value) return null; // let `required` handle empties
  return value.length >= 6 ? null : { weakPassword: true };
};

export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
};
