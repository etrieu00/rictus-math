import { linkedSignal, Service, signal } from '@angular/core';
import { Card } from '../models/card';
import { Reveal } from '../app';
import { shuffle } from '../utilities/shuffle';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Service()
export class DeckManagerService {
  Blank = {
    id: '0',
    image: 'https://api.gatcg.com/cards/images/card-back.jpg',
    name: '',
    cost: 2,
  } as const;
  readonly reveals: Reveal = {
    status: 'Rictus',
    reveals: [this.Blank, this.Blank],
  };

  $ImportedDeck = signal<Card[]>([]);
  $SimulatedReveals = signal<Reveal>(this.reveals);
  $SimulatedRevealed = signal<Card[]>([]);
  $SimulatedDeck = signal<Card[]>([]);

  $SimulatedCardReveal = signal<Card | undefined>(undefined);
  $SimulatedDeckDetail = linkedSignal({
    source: () => this.$SimulatedDeck,
    computation: (source) =>
      Object.entries(
        source().reduce(
          (acc, cur) => ({
            ...acc,
            [cur.name]: (acc[cur.name as string] ?? 0) + 1,
          }),
          {} as Record<string, number>,
        ),
      )
        .map(([name, count]) => ({
          name,
          count,
          chance: (count / source().length) * 100,
        }))
        .sort((left, right) => {
          if (right.count - left.count !== 0) {
            return right.count - left.count;
          } else {
            return left.name.localeCompare(right.name);
          }
        }),
  });

  constructor() {
    toObservable(this.$ImportedDeck)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.shuffleUnknown());
  }

  onDrop($event: CdkDragDrop<Card[]>) {
    if ($event.previousContainer.id !== $event.container.id) {
      const sourceList = [...$event.previousContainer.data];
      const targetList = [...$event.container.data];
      transferArrayItem(sourceList, targetList, $event.previousIndex, sourceList.length - 1);
      if ($event.previousContainer.id === 'revealed') {
        this.$SimulatedRevealed.set(sourceList);
        this.$SimulatedDeck.set(targetList);
      } else {
        this.$SimulatedRevealed.set(targetList);
        this.$SimulatedDeck.set(sourceList);
      }
    }
  }

  rictusMyCards() {
    const {
      status,
      reveals: [one, two],
    } = this.$SimulatedReveals();
    if (status === 'Rictus') {
      if (this.$SimulatedDeck().length >= 1) {
        if (one.id === '0') {
          this.$SimulatedDeck.update((state) => {
            const [card, ...rest] = state;
            this.$SimulatedCardReveal.set(card);
            this.$SimulatedRevealed.update((cards) => [card, ...cards]);
            this.$SimulatedReveals.set({ status: 'Rictus', reveals: [card, two] });
            return rest;
          });
        } else if (two.id === '0') {
          this.$SimulatedDeck.update((state) => {
            const [card, ...rest] = state;
            this.$SimulatedCardReveal.set(card);
            this.$SimulatedRevealed.update((cards) => [card, ...cards]);
            this.$SimulatedReveals.set({ status: 'Reset', reveals: [one, card] });
            return rest;
          });
        }
      }
    } else {
      this.$SimulatedReveals.set(this.reveals);
    }
  }

  shuffleUnknown() {
    this.$SimulatedCardReveal.set(undefined);
    this.$SimulatedReveals.set(this.reveals);
    this.$SimulatedRevealed.set([]);
    this.$SimulatedDeck.set([]);
    this.$SimulatedDeck.set(shuffle(this.$ImportedDeck()));
  }
}
