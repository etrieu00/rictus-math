import { Component, inject, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Formulas } from '../models/calculation';
import { DeckManagerService } from '../services/deck-manager.service';
import { Card } from '../models/card';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'page-simulation',
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, DecimalPipe],
  template: `
    <div class="grid grid-cols-12 grid-rows-12 w-full h-full gap-8 pr-8">
      <div class="grid grid-rows-12 col-span-6 row-span-12 gap-4" cdkDropListGroup>
        <div class="row-span-6 w-full h-full px-4 py-2 bg-slate-500 rounded-md">
          <div
            id="revealed"
            cdkDropList
            [cdkDropListData]="$SimulatedRevealed()"
            (cdkDropListDropped)="onDrop($event)"
            class="flex flex-wrap w-full h-full overflow-y-auto gap-4 content-start scrollbar-none"
          >
            @for (card of $SimulatedRevealed(); track $index) {
              <div cdkDrag class="aspect-5/7 w-[calc((100%-3rem)/4)]">
                <img [src]="card.image" class="w-full h-full object-cover rounded-xl" />
              </div>
            }
          </div>
        </div>
        <div class="flex row-span-6 w-full h-full px-4 py-2 bg-slate-500 rounded-md ">
          <div
            id="unknown"
            cdkDropList
            [cdkDropListData]="$SimulatedDeck()"
            (cdkDropListDropped)="onDrop($event)"
            class="flex flex-wrap w-full h-full overflow-y-auto gap-4 content-start scrollbar-none"
          >
            @for (card of $SimulatedDeck(); track $index) {
              <div cdkDrag class="aspect-5/7 w-[calc((100%-3rem)/4)]">
                <img
                  [src]="$HideCard() ? DEFAULT_BLANK.image : card.image"
                  class="w-full h-full object-cover rounded-xl"
                />
              </div>
            }
          </div>
        </div>
      </div>
      <div
        class="flex flex-wrap w-full h-full flex-row gap-8 col-span-6 row-span-5 p-2 justify-items-center justify-center max-w-190"
      >
        @for (reveal of $SimulatedReveals().reveals; track $index) {
          <div class="aspect-5/7 w-[calc((100%-8rem)/1.75)]">
            <img [src]="reveal.image" class="w-full h-full object-cover rounded-xl" />
          </div>
        }
      </div>
      <div class="w-full h-full gap-4 col-start-7 row-start-7 col-span-6 row-span-1 p-2">
        <div class="flex flex-row justify-items-center gap-4">
          <button class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32" (click)="rictusMyCards()">
            {{ $SimulatedReveals().status }}
          </button>
          <button class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32" (click)="shuffleUnknown()">
            Shuffle
          </button>
          <button
            class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32"
            (click)="$HideCard.set(!$HideCard())"
          >
            {{ $HideCard() ? 'Show' : 'Hide' }}
          </button>
        </div>
      </div>
      <div class="col-start-7 row-start-8 col-span-6 w-full h-full">
        <table class="table-auto w-full text-sm text-left border border-slate-400">
          <thead class="text-sm text-body border-b border-slate-400">
            <tr>
              <th scope="col" class="px-3 py-3 bg-gray-600 border border-slate-400">Math</th>
              <th scope="col" class="px-3 py-3 bg-gray-600 border border-slate-400">% Chance</th>
              <th scope="col" class="px-3 py-3 bg-gray-600 border border-slate-400">Odds</th>
            </tr>
          </thead>
          <tbody>
            @for (calculation of calculations; track $index) {
              @let results = calculation.formula($SimulatedDeck(), $SimulatedReveals().reveals, $ImportedDeck());
              <tr class="border-b border-slate-400 text-center">
                <th class="px-3 py-4 whitespace-nowrap bg-slate-500 border border-slate-400 text-left" scope="row">
                  {{ calculation.name }}
                </th>
                <td class="px-3 py-4 whitespace-nowrap bg-slate-500 border border-slate-400">
                  {{ results.chance | number: '1.2-2' }}%
                </td>
                <td class="px-3 py-4 whitespace-nowrap bg-slate-500 border border-slate-400">{{ results.odds }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SimulationPage {
  #DeckManagerService = inject(DeckManagerService);

  protected readonly DEFAULT_BLANK = this.#DeckManagerService.Blank;
  protected readonly calculations = Formulas;

  readonly $HideCard = signal<boolean>(true);

  readonly $SimulatedReveals = this.#DeckManagerService.$SimulatedReveals;
  readonly $SimulatedRevealed = this.#DeckManagerService.$SimulatedRevealed;
  readonly $SimulatedDeck = this.#DeckManagerService.$SimulatedDeck;
  readonly $ImportedDeck = this.#DeckManagerService.$ImportedDeck;

  readonly onDrop = ($event: CdkDragDrop<Card[]>) => this.#DeckManagerService.onDrop($event);
  readonly rictusMyCards = () => this.#DeckManagerService.rictusMyCards();
  readonly shuffleUnknown = () => this.#DeckManagerService.shuffleUnknown();
}
