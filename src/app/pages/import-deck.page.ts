import { Component, inject } from '@angular/core';
import { DeckParserService } from '../services/deck-parser.service';

@Component({
  selector: 'page-import-deck',
  imports: [],
  template: `
    <div class="grid grid-cols-12 grid-rows-12">
    <div class="flex flex-col gap-4 col-span-6 row-span-12 pt-8">
      <button class="w-full p-4 bg-mist-500 hover:bg-slate-600 rounded-md" (click)="parseDeck$.next(deckList.value)">
      Import Deck!
      </button>
      <textarea #deckList class="w-full h-200 bg-white text-black p-4"></textarea>
    </div>
    </div>
  `,
})
export class ImportDeckPage {
  #DeckParserService = inject(DeckParserService);

  parseDeck$ = this.#DeckParserService.parseDeck$;
}
