import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: responseActivities }) => {
        if (!Array.isArray(responseActivities)) {
          throw new Error('The activities response was invalid.');
        }
        if (active) setActivities(responseActivities);
      })
      .catch((cause: unknown) => {
        if (active) {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(`Unable to load activities: ${message}`);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {error ? (
          <p role="alert">{error}</p>
        ) : activities === null ? (
          <p role="status">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities yet.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {activities.map((activity, index) => (
              <li key={index}>
                {activity.type} · {activity.minutes} minutes · {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
