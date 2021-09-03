import * as Express from "express";
import { db, fieldValue, database } from "../../../admin";
const express = Express;
const router = express.Router();
const endPoint = "/employee";

type PostRequest = {
  officeId: string;
  employeeId: string;
};
type Room = {
  room_id: string;
  x_coordinate: number;
  y_coordinate: number;
  join_employees: string[];
};
type DeleteRequest = {
  officeId: string;
  employeeId: string;
  overlapFurniture: [];
};

type Employee_data = {
  uid: string;
};

router.route(endPoint).put(async (req, res) => {
  const body = JSON.parse(req.body.data) as PostRequest;
  const { officeId, employeeId } = body;
  res.set("Access-Control-Allow-Origin", "true");

  const roomRef = db
    .collection("offices")
    .doc(officeId)
    .collection("room")
    .doc("room");

  await db
    .runTransaction(async (transaction) => {
      let newRooms: Room[];
      await transaction.get(roomRef).then(async (snapshot) => {
        const rooms = snapshot.data() as Room[];
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
            transaction.update(roomRef, {
              rooms: newRooms
            });
          }
        }
      });
      database.ref(`status/${officeId}/${employeeId}`).set({
        status: false
      });
    })
    .then(() => res.json({ message: "success" }))
    .catch((e) => res.json({ message: "failed", e: e }));
});

//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

router.route(endPoint).delete(async (req, res) => {
  console.log("到達を確認");
  const body = JSON.parse(req.body.data) as DeleteRequest;
  const { officeId, employeeId } = body;

  //先にオフラインにする
  await db
    .collection("offices")
    .doc(officeId)
    .collection("employees")
    .doc(employeeId)
    .update({
      is_office: false
    });

  const furnitureRef = db
    .collection("offices")
    .doc(officeId)
    .collection("furniture");

  const employeeRef = db
    .collection("offices")
    .doc(officeId)
    .collection("employees")
    .doc(employeeId);

  const roomRef = db
    .collection("offices")
    .doc(officeId)
    .collection("room")
    .doc("room");
  await db
    .runTransaction(async (transaction) => {
      const employeeSnapshot = await transaction.get(employeeRef);
      const { uid } = employeeSnapshot.data() as Employee_data;
      await transaction.get(furnitureRef).then(async (snapshots) => {
        snapshots.forEach(async (snapshot) => {
          const joinEmployees: string[] = snapshot.data().join_employees;
          joinEmployees.forEach((joinEmployee) => {
            if (joinEmployee === employeeId) {
              const exitRef = db
                .collection("offices")
                .doc(officeId)
                .collection("furniture")
                .doc(snapshot.id);
              transaction.update(exitRef, {
                join_employees: fieldValue.arrayRemove(employeeId)
              });
            }
          });
        });
      });
      const userRef = db
        .collection("users")
        .doc(uid)
        .collection("employee_to_office")
        .doc(employeeId);
      transaction.delete(employeeRef);
      transaction.delete(userRef);
      transaction.update(roomRef, {
        join_employees: fieldValue.arrayRemove(employeeId)
      });
    })
    .then(() => res.json({ message: "success" }))
    .catch((e) => res.json({ message: "failed", e: e }));
});

export { router as employeeRouter };
//module.exports = router;
