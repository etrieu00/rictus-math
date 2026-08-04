import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Card } from './models/card';
import { DeckManagerService } from './services/deck-manager.service';
import { DecimalPipe } from '@angular/common';

export interface Tab {
  id: string;
  name: string;
}

export interface Reveal {
  status: 'Rictus' | 'Reset';
  reveals: Card[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DecimalPipe],
  template: `
    <main class="w-screen h-screen grid grid-cols-12 grid-rows-12 gap-4 p-8 bg-gray-700 text-white">
      <div class="col-span-3 row-span-4">
        <ul class="flex flex-col border-r-slate-600 border-r-4 gap-4 h-full text-2xl pt-20">
          @for (tab of tabs; track $index) {
            <li>
              <button
                routerLinkActive="bg-slate-600"
                class="inline-flex items-center px-4 py-2.5 rounded-l-2xl hover:bg-slate-600 w-full"
              >
                <a [routerLink]="[tab.id]">{{ tab.name }}</a>
              </button>
            </li>
          }
        </ul>
      </div>
      <div class="row-start-5 col-span-3 row-span-8 pr-8">
        @if ($Tab().id === 'simulation') {
          <div class="w-full h-full overflow-y-auto scrollbar-none">
            <table class="table-auto w-full text-sm text-left border border-slate-400">
              <thead class="text-sm text-body border-b border-slate-400 box-border">
                @let revealed = $SimulatedCardReveal();
                <tr>
                  <th class="px-3 py-1 bg-gray-800 border border-slate-400" colspan="3">Last Card Revealed</th>
                </tr>
                <tr>
                  <th class="px-3 py-1 bg-gray-800 border border-slate-400" colspan="3">{{ revealed?.name }}</th>
                </tr>
                <tr>
                  <th class="px-3 py-3 bg-gray-600 border border-slate-400">#</th>
                  <th class="px-3 py-3 bg-gray-600 border border-slate-400">Card Name</th>
                  <th class="px-3 py-3 bg-gray-600 border border-slate-400">Draw %</th>
                </tr>
              </thead>
              <tbody class="overflow-y-auto">
                @for (detail of $SimulatedDeckDetail(); track $index) {
                  <tr>
                    <th class="px-3 py-1 bg-slate-500 border border-slate-400">{{ detail.count }}</th>
                    <th class="px-3 py-1 bg-slate-500 border border-slate-400">{{ detail.name }}</th>
                    <th class="px-3 py-1 bg-slate-500 border border-slate-400">
                      {{ detail.chance | number: '1.2-2' }}%
                    </th>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      <div class="col-span-9 row-span-12">
        <router-outlet />
      </div>
    </main>
  `,
})
export class App {
  #ActivatedRoute = inject(ActivatedRoute);
  #DeckManagerService = inject(DeckManagerService);
  $SimulatedCardReveal = this.#DeckManagerService.$SimulatedCardReveal;
  $SimulatedDeckDetail = this.#DeckManagerService.$SimulatedDeckDetail;

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

  $Tab = signal<Tab>(this.tabs[1]);

  constructor() {
    this.#ActivatedRoute.fragment
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe((fragment) => this.$Tab.set(this.tabs.find((tab) => tab.id === fragment) ?? this.tabs[1]));
  }
}
