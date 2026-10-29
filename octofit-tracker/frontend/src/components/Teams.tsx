import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: responseTeams }) => {
        if (!Array.isArray(responseTeams)) {
          throw new Error('The teams response was invalid.');
        }
        if (active) setTeams(responseTeams);
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(`Unable to load teams: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {teams.map((team, index) => <li key={index}>{team.name}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
