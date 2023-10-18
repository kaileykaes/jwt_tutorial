import { Router } from "https://deno.land/x/oak/mod.ts";
import { signup, signin } from "../controllers/users.ts";
import { create, getTasks, getById, updateById, deleteTask } from "../controllers/tasks.ts";
import { authorized } from "../middlewares/isAuthorized.ts";

const router = new Router;

//User routes
router.post("/api/signup", signup)
      .post("/api/signin", signin);

//Task routes
router.post("/api/tasks", authorized, create)
      .get("/api/tasks", authorized, getTasks)
      .get("/api/tasks/:taskId", authorized, getById)
      .patch("/api/tasks/:taskId", authorized, updateById)
      .delete("/api/tasks/:taskId", authorized, deleteTask);
      
export default router;