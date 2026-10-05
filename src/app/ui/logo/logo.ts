import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 13 L6 6 L13 6" />
      <path d="M19 6 L26 6 L26 13" />
      <path d="M13 26 L6 26 L6 19" />
      <path d="M26 19 L26 26 L19 26" class="accent" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    .accent {
      stroke: hsl(var(--secondary));
    }
  `,
})
export class LogoComponent {
  @Input() size = 24;
}
