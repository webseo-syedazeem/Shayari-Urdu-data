import Carousel from './Carousel';
import ShayariCard from './ShayariCard';
import type { Shayari } from '../services/api';

interface PoetryOfTheDayProps {
  items: readonly Shayari[];
  onSelect: (item: Shayari) => void;
}

export function PoetryOfTheDay({ items, onSelect }: PoetryOfTheDayProps) {
  return (
    <section className="mb-16">
      <Carousel title="Poetry of the Day">
        {items.length > 0 && items.map((shayari) => (
          <div key={shayari.id} className="w-80 flex-shrink-0">
            <ShayariCard shayari={shayari} onClick={() => onSelect(shayari)} />
          </div>
        )) }
      </Carousel>
    </section>
  );
}
