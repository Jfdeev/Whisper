//Barrel File (arquivo que exporta tudo que tem dentro)
import { audioChunks } from './audio-chunks.ts';
import { questions } from './questions.ts';
import { rooms } from './rooms.ts';
import { activities, activityResponses } from './activities.ts';
import { users } from './users.ts';
import { folders } from './folders.ts';

export const schema = {
    users,
    folders,
    rooms,
    questions,
    audioChunks,
    activities,
    activityResponses
}