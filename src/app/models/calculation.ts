import { Card } from './card';
import { CalculationResult } from './calculation-result';

export interface Calculation {
  name: string;
  formula: (hidden: Card[], reveal?: Card[], deck?: Card[]) => CalculationResult;
}

export const Formulas: Calculation[] = [
  {
    name: 'First Revealed Eligibility for Rictus Tiding',
    formula: (hidden) => {
      const eligible = hidden.filter(({ cost }) => cost >= 0 && cost <= 8);
      const available = new Set(eligible.map(({ cost }) => cost));
      const candidates = eligible.filter(({ cost }) => available.has(8 - cost));
      return {
        chance: candidates.length / hidden.length * 100,
        odds: `${candidates.length}/${hidden.length}`,
      };
    },
  },
];
