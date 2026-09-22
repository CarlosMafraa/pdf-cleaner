import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <div class="relative inline-flex group/tooltip">
      <ng-content />
      <span
        class="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md opacity-0 scale-95 transition-all duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 z-50"
      >
        {{ text }}
      </span>
    </div>
  `,
})
export class TooltipComponent {
  @Input() text = '';
}
