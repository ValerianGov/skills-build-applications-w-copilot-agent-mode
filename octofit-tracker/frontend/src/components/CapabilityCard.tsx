import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  collection: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  endpoint,
  collection,
  emptyMessage,
  renderItem,
}: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);
    getJson<Record<string, T[]>>(endpoint)
      .then((response) => {
        const collectionItems = response[collection];
        if (!Array.isArray(collectionItems)) {
          throw new Error(`The ${title.toLowerCase()} response was invalid.`);
        }
        if (active) setItems(collectionItems);
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(`Unable to load ${title.toLowerCase()}: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, [collection, endpoint, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
