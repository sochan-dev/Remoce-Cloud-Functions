import Express = require("express");
import cors from "cors";
import { messageRouter } from "./src/routers/messages/route";
import { roomRouter } from "./src/routers/room/route";
import { furnitureRouter } from "./src/routers/furniture/route";
import { employeeRouter } from "./src/routers/employee/route";
import dotenv from "dotenv";
import { cf, db } from "./admin";

dotenv.config();
const app = Express();

app.use(cors({ origin: true, credentials: true }));
app.use("/", messageRouter);
app.use("/", roomRouter);
app.use("/", furnitureRouter);
app.use("/", employeeRouter);

export const onEmployeeStatusChanged = cf.database
  .ref("status/{officeId}/{employeeId}")
  .onUpdate((snapshot, context) => {
    const newStatus = snapshot.after.val();
    db.collection("offices")
      .doc(context.params.officeId)
      .collection("employees")
      .doc(context.params.employeeId)
      .update({
        is_office: newStatus.status
      });
    return;
  });

export const remoce = cf.region("asia-northeast1").https.onRequest(app);
