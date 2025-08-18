import { Queue } from 'bullmq';

// Here A job is created for each event

const connection = {
    connection: {
        host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    }
}

export const notesQueue = new Queue("notes-queue", connection);

export async function enqueueNotes(notesId, releaseAt){
    return notesQueue.add(
        "deliver-notes",
        { id: notesId},
        {
            delay: Math.max(0, new Date(releaseAt).getTime() - Date.now()),
            attempts: 5,
            backoff: {
                type: "exponential",
                delay: 1000
            },
            removeOnComplete: true,
            removeOnFail:false
        }
    )
}

export async function replayNotes(notesId){
    return notesQueue.add("deliver-notes", { id: notesId}, { attempts: 3});
}

module.exports = { createQueue };
