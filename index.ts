import Express = require("express");
import cors from "cors";
import { messageRouter } from "./src/routers/messages/route";
import { roomRouter } from "./src/routers/room/route";
import { furnitureRouter } from "./src/routers/furniture/route";
import { employeeRouter } from "./src/routers/employee/route";
import dotenv from "dotenv";
import { cf, db, fieldValue } from "./admin";

dotenv.config();
const app = Express();
console.log("hello");
app.use(cors({ origin: true, credentials: true }));
app.use(function (req, res, next) {
  console.log("req.headers.origin", req.headers.origin);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use("/", messageRouter);
app.use("/", roomRouter);
app.use("/", furnitureRouter);
app.use("/", employeeRouter);

export const onEmployeeStatusChanged = cf.database
  .ref("status/{employeeId}")
  .onUpdate(async (snapshot, context) => {
    const newStatus = snapshot.after.val();
    const officeId = newStatus.officeId;
    const employeeId = context.params.employeeId;

    await db
      .collection("offices")
      .doc(officeId)
      .collection("employees")
      .doc(employeeId)
      .update({
        is_office: newStatus.status
      });

    if (!newStatus.status) {
      const roomRef = db
        .collection("offices")
        .doc(officeId)
        .collection("room")
        .doc("room");

      const roomSnapshot = await roomRef.get();
      const rooms = roomSnapshot.data() as {
        room_id: string;
        x_coordinate: number;
        y_coordinate: number;
        join_employees: string[];
      }[];
      let newRooms: typeof rooms;
      if (rooms) {
        if (rooms.length > 0) {
          newRooms = rooms.map((room) => {
            const newJoinEmployee = room.join_employees.filter((empId) => {
              empId !== employeeId;
            });
            return {
              ...room,
              join_employees: newJoinEmployee
            };
          });
          newRooms = newRooms.filter((room) => room.join_employees.length > 1);
          await roomRef.update({
            rooms: newRooms
          });
        }
      }

      await db
        .collection("offices")
        .doc(officeId)
        .collection("furniture")
        .get()
        .then(async (snapshots) => {
          snapshots.forEach(async (snapshot) => {
            await db
              .collection("offices")
              .doc(officeId)
              .collection("furniture")
              .doc(snapshot.id)
              .update({
                join_employees: fieldValue.arrayRemove(employeeId)
              });
          });
        });
    }

    return;
  });

export const remoce = cf.region("asia-northeast1").https.onRequest(app);
