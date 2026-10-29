import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; reason: string };
const userEmail = 'mona@example.com';
const suggestionsEndpoint = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(suggestionsEndpoint)
      .then(({ suggestions: responseSuggestions }) => {
        if (!Array.isArray(responseSuggestions)) {
          throw new Error('The workout suggestions response was invalid.');
        }
        if (active) setSuggestions(responseSuggestions);
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(`Unable to load workout suggestions: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p>No workout suggestions yet.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <strong>{suggestion.title}</strong>: {suggestion.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
