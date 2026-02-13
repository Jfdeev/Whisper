import { fastify } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { fastifyCors } from "@fastify/cors";
import { fastifyMultipart } from "@fastify/multipart";
import { env } from "./env.ts";
import { createQuestionRoute } from "./routes/create-question.ts";
import { createRoomFromAudioRoute } from "./routes/create-room-from-audio.ts";
import { createRoomRoute } from "./routes/create-room.ts";
import { deleteRoomRoute } from "./routes/delete-room.ts";
import { getQuestionsByRoomRoute } from "./routes/get-questions-by-room.ts";
import { getRoomRoute } from "./routes/get-room.ts";
import { getRooms } from "./routes/get-rooms.ts";
import { uploadAudioRoute } from "./routes/upload-audio.ts";
import { createActivityRoute } from "./routes/create-activity.ts";
import { getActivitiesRoute } from "./routes/get-activities.ts";
import { getActivityRoute } from "./routes/get-activity.ts";
import { submitActivityRoute } from "./routes/submit-activity.ts";
import { deleteActivityRoute } from "./routes/delete-activity.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.get("/health", () => {
  return "OK";
});

app.register(getRooms);
app.register(createRoomRoute);
app.register(createRoomFromAudioRoute);
app.register(createQuestionRoute);
app.register(getRoomRoute);
app.register(getQuestionsByRoomRoute);
app.register(uploadAudioRoute);
app.register(deleteRoomRoute);
app.register(createActivityRoute);
app.register(getActivitiesRoute);
app.register(getActivityRoute);
app.register(submitActivityRoute);
app.register(deleteActivityRoute);

app.listen({ port: env.PORT, host: env.HOST }).then(() => {
  console.log(`Server is running on http://${env.HOST}:${env.PORT}`);
});
