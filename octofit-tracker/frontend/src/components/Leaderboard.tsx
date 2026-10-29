import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (!Array.isArray(leaderboard)) {
          throw new Error('The leaderboard response was invalid.');
        }
        if (active) setEntries(leaderboard);
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(`Unable to load leaderboard: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : entries === null ? (
          <p role="status">Loading leaderboard...</p>
        ) : entries.length === 0 ? (
          <p>No leaderboard rankings yet.</p>
        ) : (
          <ol className="mb-0">
            {entries.map((entry, index) => (
              <li key={index}>
                {entry.rank}. {entry.teamName} · {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
