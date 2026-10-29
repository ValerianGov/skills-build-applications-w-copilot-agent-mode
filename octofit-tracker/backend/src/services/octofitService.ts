import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Activity input is invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Team input is invalid'), { status: 400 });
  }

  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== members.length) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [activity] = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).select('type').lean();
  const workouts = await Workout.find({ focus: user.fitnessGoal }).sort({ title: 1 }).limit(1).lean();
  const reason = activity
    ? `Recommended for your ${user.fitnessGoal} goal and recent ${activity.type} activity.`
    : `Recommended for your ${user.fitnessGoal} fitness goal.`;
  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
