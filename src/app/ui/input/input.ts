import { Directive, HostBinding, Input } from '@angular/core';
import { cn } from '../../lib/utils';

@Directive({
  selector: 'input[appInput]',
  standalone: true,
})
export class InputDirective {
  @Input() class = '';

  @HostBinding('class')
  get hostClass() {
    return cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      this.class
    );
  }
}
