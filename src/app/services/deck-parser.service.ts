import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  combineLatestWith,
  concatMap,
  filter,
  from,
  map,
  mergeMap,
  of,
  reduce,
  repeat,
  Subject,
  tap,
  toArray,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeckManagerService } from './deck-manager.service';
import { Router } from '@angular/router';
import { Card } from '../models/card';
import { CardMapping } from '../models/card-mapping';

@Service()
export class DeckParserService {
  #DeckManager = inject(DeckManagerService);

  #HttpClient = inject(HttpClient);
  #Router = inject(Router);

  parseDeck$ = new Subject<string>();

  constructor() {
    this.parseDeck$
      .pipe(
        takeUntilDestroyed(),
        combineLatestWith(
          this.#HttpClient.get<CardMapping[]>('card-mapping.json').pipe(
            concatMap((mappings) => from(mappings)),
            reduce((acc, { name, slug }) => ({ ...acc, [name]: slug }), {} as Record<string, string>),
          ),
        ),
        mergeMap(([wall, mapping]) =>
          from(wall.split('\n')).pipe(
            map((lines) => lines.split(' ')),
            map(([count, ...name]) => [count, name.join(' ')]),
            mergeMap(([count, name]) =>
              this.#HttpClient.get<any>(`https://api.gatcg.com/cards/${mapping[name]}`).pipe(
                catchError(() => of()),
                filter(Boolean),
                map(
                  ({ cost: { value }, name, editions: [select, ..._] }) =>
                    ({
                      id: crypto.randomUUID(),
                      name: String(name),
                      cost: Number(value),
                      image: `https://api.gatcg.com${select.image}`,
                    }) as Card,
                ),
                map((card) => [count, card]),
              ),
            ),
            mergeMap(([count, card]) => of(card as Card).pipe(repeat(Number(count)))),
            toArray(),
          ),
        ),
        tap((deck) => this.#DeckManager.$ImportedDeck.set(deck)),
      )
      .subscribe(async () => {
        await this.#Router.navigate(['simulation']);
      });
  }
}
