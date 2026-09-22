import { Component, Input } from '@angular/core';
import type { Margins } from '../../core/presets.service';

interface Mark {
  pos: number;
  value: number;
  isMajor: boolean;
}

@Component({
  selector: 'app-rulers',
  standalone: true,
  template: `
    <div class="relative select-none">
      <!-- Canto - Editorial Indicator -->
      <div class="absolute top-0 left-0 bg-muted flex items-center justify-center" [style.width.px]="rulerSize" [style.height.px]="rulerSize">
        <span class="label-sm text-muted-foreground">PT</span>
      </div>

      <!-- Régua horizontal -->
      <div class="absolute top-0 bg-background overflow-hidden" [style.left.px]="rulerSize" [style.height.px]="rulerSize" [style.width.px]="width * scale">
        <svg [attr.width]="width * scale" [attr.height]="rulerSize">
          @for (mark of horizontalMarks(); track mark.pos) {
            <line [attr.x1]="mark.pos" [attr.y1]="mark.isMajor ? 8 : 14" [attr.x2]="mark.pos" [attr.y2]="rulerSize" stroke="currentColor" stroke-width="1" class="text-primary/40" />
            @if (mark.isMajor) {
              <text [attr.x]="mark.pos + 3" y="12" font-size="9" fill="currentColor" class="text-primary/70 font-mono">{{ mark.value }}</text>
            }
          }
        </svg>

        @if (margins.left > 0) {
          <div class="absolute top-0 bottom-0 bg-primary/5" style="left: 0" [style.width.px]="margins.left * scale">
            <div class="absolute right-0 w-[1px] h-full bg-primary/20"></div>
          </div>
        }
        @if (margins.right > 0) {
          <div class="absolute top-0 bottom-0 bg-primary/5" style="right: 0" [style.width.px]="margins.right * scale">
            <div class="absolute left-0 w-[1px] h-full bg-primary/20"></div>
          </div>
        }
      </div>

      <!-- Régua vertical -->
      <div class="absolute left-0 bg-background overflow-hidden" [style.top.px]="rulerSize" [style.width.px]="rulerSize" [style.height.px]="height * scale">
        <svg [attr.width]="rulerSize" [attr.height]="height * scale">
          @for (mark of verticalMarks(); track mark.pos) {
            <line [attr.x1]="mark.isMajor ? 8 : 14" [attr.y1]="mark.pos" [attr.x2]="rulerSize" [attr.y2]="mark.pos" stroke="currentColor" stroke-width="1" class="text-primary/40" />
            @if (mark.isMajor) {
              <text x="4" [attr.y]="mark.pos + 3" font-size="9" fill="currentColor" class="text-primary/70 font-mono" [attr.transform]="'rotate(-90, 4, ' + mark.pos + ')'">{{ mark.value }}</text>
            }
          }
        </svg>

        @if (margins.top > 0) {
          <div class="absolute left-0 right-0 bg-primary/5" style="top: 0" [style.height.px]="margins.top * scale">
            <div class="absolute bottom-0 w-full h-[1px] bg-primary/20"></div>
          </div>
        }
        @if (margins.bottom > 0) {
          <div class="absolute left-0 right-0 bg-primary/5" style="bottom: 0" [style.height.px]="margins.bottom * scale">
            <div class="absolute top-0 w-full h-[1px] bg-primary/20"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class RulersComponent {
  @Input({ required: true }) width!: number;
  @Input({ required: true }) height!: number;
  @Input({ required: true }) scale!: number;
  @Input({ required: true }) margins!: Margins;

  readonly rulerSize = 24;

  private buildMarks(length: number): Mark[] {
    const marks: Mark[] = [];
    const step = this.scale > 0.5 ? 50 : 100;
    for (let i = 0; i <= length; i += step) {
      marks.push({ pos: i * this.scale, value: Math.round(i), isMajor: i % (step * 2) === 0 });
    }
    return marks;
  }

  horizontalMarks(): Mark[] {
    return this.buildMarks(this.width);
  }

  verticalMarks(): Mark[] {
    return this.buildMarks(this.height);
  }
}
