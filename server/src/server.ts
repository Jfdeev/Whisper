import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { fastifyCors } from "@fastify/cors";
import { fastifyMultipart } from "@fastify/multipart";
import { fastifyJwt } from "@fastify/jwt";
import { env } from "./env.ts";
import { createRoomFromAudioRoute } from "./routes/create-room-from-audio.ts";
import { createRoomRoute } from "./routes/create-room.ts";
import { deleteRoomRoute } from "./routes/delete-room.ts";
import { getRoomRoute } from "./routes/get-room.ts";
import { getRooms } from "./routes/get-rooms.ts";
import { uploadAudioRoute } from "./routes/upload-audio.ts";
import { createActivityRoute } from "./routes/create-activity.ts";
import { getActivitiesRoute } from "./routes/get-activities.ts";
import { getActivityRoute } from "./routes/get-activity.ts";
import { submitActivityRoute } from "./routes/submit-activity.ts";
import { deleteActivityRoute } from "./routes/delete-activity.ts";
import { registerRoute } from "./routes/register.ts";
import { loginRoute } from "./routes/login.ts";
import { verifyRoute } from "./routes/verify.ts";
import { createFolderRoute } from "./routes/create-folder.ts";
import { getFoldersRoute } from "./routes/get-folders.ts";
import { updateFolderRoute } from "./routes/update-folder.ts";
import { deleteFolderRoute } from "./routes/delete-folder.ts";
import { moveLessonToFolderRoute } from "./routes/move-lesson-to-folder.ts";
import { updateRoomRoute } from "./routes/update-room.ts";
import { getAudioChunksRoute } from "./routes/get-audio-chunks.ts";
import { aiContinueTextRoute } from "./routes/ai-continue-text.ts";
import { aiGenerateSummaryRoute } from "./routes/ai-generate-summary.ts";
import { aiChatQuestionRoute } from "./routes/ai-chat-question.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.get("/health", () => {
  return "OK";
});

// Auth routes
app.register(registerRoute);
app.register(loginRoute);
app.register(verifyRoute);

// Folder routes
app.register(createFolderRoute);
app.register(getFoldersRoute);
app.register(updateFolderRoute);
app.register(deleteFolderRoute);
app.register(moveLessonToFolderRoute);

// Room routes
app.register(getRooms);
app.register(createRoomRoute);
app.register(createRoomFromAudioRoute);
app.register(updateRoomRoute);
app.register(getRoomRoute);
app.register(uploadAudioRoute);
app.register(getAudioChunksRoute);
app.register(deleteRoomRoute);
app.register(createActivityRoute);
app.register(getActivitiesRoute);
app.register(getActivityRoute);
app.register(submitActivityRoute);
app.register(deleteActivityRoute);

// AI routes
app.register(aiContinueTextRoute);
app.register(aiGenerateSummaryRoute);
app.register(aiChatQuestionRoute);

app.listen({ port: env.PORT }).then(() => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
