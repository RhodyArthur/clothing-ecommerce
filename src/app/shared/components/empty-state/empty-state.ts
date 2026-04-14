import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  imports: [RouterModule, ButtonModule],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  title = input('Nothing to show');
  description = input('');
  icon = input('pi pi-inbox');
  actionLabel = input('');
  actionRouterLink = input('');
  action = output<void>();

  onAction(): void {
    this.action.emit();
  }
}
