import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, transferArrayItem } from '@angular/cdk/drag-drop';

export interface Tab {
  id: string;
  name: string;
}

export interface Card {
  id: string;
  image: string;
  name: string;
  cost: number;
}

export interface Calculation {
  name: string;
  formula?: (reveal: Card[], hidden: Card[], deck: Card[]) => CalculationResult;
}

export interface CalculationResult {}

@Component({
  selector: 'app-root',
  imports: [CdkDrag, CdkDropList, CdkDropListGroup],
  template: `
    <main class="w-screen h-screen grid grid-cols-12 grid-rows-12 gap-4 p-8 bg-gray-700 text-white">
      <div class="col-span-1 row-span-12">
        <ul class="flex flex-col border-r-slate-600 border-r-4 gap-4 h-full text-2xl pt-20">
          @for (tab of tabs; track $index) {
            <li>
              <button
                [class.bg-slate-600]="$Tab().id === tab.id"
                class="inline-flex items-center px-4 py-2.5 rounded-l-2xl hover:bg-slate-600 w-full"
              >
                <a href="#{{ tab.id }}">{{ tab.name }}</a>
              </button>
            </li>
          }
        </ul>
      </div>
      @switch ($Tab().id) {
        @case ('deck') {}
        @case ('simulation') {
          <div class="grid grid-rows-12 col-start-2 col-span-5 row-span-12 gap-4" cdkDropListGroup>
            <div class="row-span-6 w-full h-full px-4 py-2 bg-slate-500 rounded-md">
              <div
                id="revealed"
                cdkDropList
                [cdkDropListData]="$Revealed()"
                (cdkDropListDropped)="onDrop($event)"
                class="flex flex-wrap w-full h-full overflow-y-auto gap-4 content-start scrollbar-none"
              >
                @for (card of $Revealed(); track $index) {
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
                [cdkDropListData]="$Unknown()"
                (cdkDropListDropped)="onDrop($event)"
                class="flex flex-wrap w-full h-full overflow-y-auto gap-4 content-start scrollbar-none"
              >
                @for (card of $Unknown(); track $index) {
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
          <div class="flex flex-row gap-16 col-span-5 row-span-5 p-4 w-full h-full justify-items-center justify-center">
            <div class="aspect-5/7">
              <img [src]="$RevealedOne().image" class="w-full h-full object-cover rounded-xl" />
            </div>
            <div class="aspect-5/7">
              <img [src]="$RevealedTwo().image" class="w-full h-full object-cover rounded-xl" />
            </div>
          </div>
          <div class="flex flex-row gap-4 col-span-5 row-span-1 p-4 justify-items-center">
            <button
              class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32"
              (click)="selectRandomRevealOne()"
            >
              First
            </button>
            <button
              class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32"
              (click)="selectRandomRevealTwo()"
            >
              Second
            </button>
            <button class="px-2 py-3 bg-mist-500 hover:bg-mist-600 rounded-md min-w-32" (click)="resetSimulation()">
              Reset
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
          <div class="col-span-5">
            <table class="w-full text-sm text-left border border-slate-400">
              <thead class="text-sm text-body border-b border-slate-400">
                <tr>
                  <th scope="col" class="px-3 py-3 bg-gray-600">Attribute</th>
                  <th scope="col" class="px-3 py-3 bg-gray-600">% Chance</th>
                  <th scope="col" class="px-3 py-3 bg-gray-600">Odds</th>
                </tr>
              </thead>
              <tbody>
                @for (calculation of calculations; track $index) {
                  <tr class="border-b border-slate-400">
                    <th class="px-3 py-4 whitespace-nowrap bg-slate-600" scope="row">{{ calculation.name }}</th>
                    <td class="px-3 py-4 whitespace-nowrap bg-slate-500 text-center">---</td>
                    <td class="px-3 py-4 whitespace-nowrap bg-slate-600 text-center">---</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @case ('import') {}
      }
    </main>
  `,
})
export class App {
  #ActivatedRoute = inject(ActivatedRoute);

  readonly DEFAULT_BLANK = {
    id: '0',
    image: 'https://api.gatcg.com/cards/images/card-back.jpg',
    name: '',
    cost: 2,
  };

  readonly tabs: Tab[] = [
    {
      id: 'deck',
      name: 'Deck',
    },
    {
      id: 'simulation',
      name: 'Simulation',
    },
    {
      id: 'import',
      name: 'Import',
    },
  ];

  readonly calculations: Calculation[] = [
    {
      name: 'Chance of Starting with Rictus Tiding',
    },
    {
      name: 'Chance of drawing Rictus Tiding',
    },
    {
      name: 'First Revealed Eligibility for Rictus Tiding',
    },
    {
      name: 'Second Revealed Eligibility for Rictus Tiding',
    },
    {
      name: 'Number of possible Rictus Tiding Combinations remaining',
    },
  ];

  $Deck = signal<Card[]>([
    {
      id: '1',
      image: 'https://api.gatcg.com/cards/images/rictus-tiding-dtr.jpg',
      name: '',
      cost: 2,
    },
    {
      id: '2',
      image: 'https://api.gatcg.com/cards/images/lightweavers-assault-p24-cpr.jpg',
      name: '',
      cost: 4,
    },
    {
      id: '3',
      image: 'https://api.gatcg.com/cards/images/uther-illustrious-king-evp.jpg',
      name: '',
      cost: 4,
    },
    {
      id: '4',
      image: 'https://api.gatcg.com/cards/images/incapacitate-p25.jpg',
      name: '',
      cost: 4,
    },
    {
      id: '5',
      image: 'https://api.gatcg.com/cards/images/enchanted-fete-dtr.jpg',
      name: '',
      cost: 4,
    },
  ]);

  $Tab = signal<Tab>(this.tabs[1]);
  $RevealedOne = signal<Card>(this.DEFAULT_BLANK);
  $RevealedTwo = signal<Card>(this.DEFAULT_BLANK);
  $Revealed = signal<Card[]>([]);
  $Unknown = signal<Card[]>(this.shuffle(this.$Deck()));
  $HideCard = signal<boolean>(true);

  constructor() {
    this.#ActivatedRoute.fragment
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe((fragment) => this.$Tab.set(this.tabs.find((tab) => tab.id === fragment) ?? this.tabs[1]));
  }

  onDrop($event: CdkDragDrop<Card[]>) {
    if ($event.previousContainer.id !== $event.container.id) {
      const sourceList = [...$event.previousContainer.data];
      const targetList = [...$event.container.data];
      transferArrayItem(sourceList, targetList, $event.previousIndex, $event.currentIndex);
      if ($event.previousContainer.id === 'revealed') {
        this.$Revealed.set(sourceList);
        this.$Unknown.set(this.shuffle(targetList));
      } else {
        this.$Revealed.set(targetList);
        this.$Unknown.set(this.shuffle(sourceList));
      }
    }
  }

  selectRandomRevealOne() {
    if (this.$Unknown().length >= 1) {
      this.$Unknown.update((state) => {
        const [card, ...rest] = state;
        this.$Revealed.update((cards) => [...cards, card]);
        this.$RevealedOne.set(card);
        return rest;
      });
    }
  }

  selectRandomRevealTwo() {
    if (this.$Unknown().length >= 1) {
      this.$Unknown.update((state) => {
        const [card, ...rest] = state;
        this.$Revealed.update((cards) => [...cards, card]);
        this.$RevealedTwo.set(card);
        return rest;
      });
    }
  }

  resetSimulation() {
    this.$RevealedOne.set(this.DEFAULT_BLANK);
    this.$RevealedTwo.set(this.DEFAULT_BLANK);
  }

  shuffleUnknown() {
    this.$RevealedOne.set(this.DEFAULT_BLANK);
    this.$RevealedTwo.set(this.DEFAULT_BLANK);
    this.$Revealed.set([]);
    this.$Unknown.set([]);
    this.$Unknown.set(this.shuffle(this.$Deck()));
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }
}
