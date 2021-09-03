import * as Express from "express";
import { db } from "../../../admin";

const express = Express;
const router = express.Router();
const endPoint = "/room";

type PostRequest = {
  roomX: number;
  roomY: number;
  officeId: string;
  joinEmployees: string[];
};
type PutRequest = {
  officeId: string;
  employeeId: string;
  overlapRoomIds: string[];
};
type Room = {
  room_id: string;
  x_coordinate: number;
  y_coordinate: number;
  join_employees: string[];
};

const getId = (myBase?: number): string => {
  let base = 1000;
  if (myBase) base = myBase;
  return (
    new Date().getTime().toString(16) +
    Math.floor(base * Math.random()).toString(16)
  );
};

router.route(endPoint).post(async (req, res) => {
  const body = JSON.parse(req.body.data) as PostRequest;
  const { officeId, joinEmployees } = body;
  const roomX = body.roomX - 10;
  const roomY = body.roomY - 10;
  const employeeId = joinEmployees[0];

  await db
    .runTransaction(async (transaction) => {
      const roomCollectionRef = db
        .collection("offices")
        .doc(officeId)
        .collection("room")
        .doc("room");

      await transaction.get(roomCollectionRef).then(async (snapshot) => {
        const data = snapshot.data();
        let rooms: Room[];
        let newRooms: Room[] = [];
        if (data) {
          rooms = data.rooms;
          const iconSize = 100;
          let isCreate = true;
          rooms.forEach((room) => {
            const startX = room.x_coordinate;
            const endX = startX + iconSize;
            const startY = room.y_coordinate;
            const endY = startY + iconSize;
            if (
              startX < roomX &&
              roomX < endX &&
              startY < roomY &&
              roomY < endY
            ) {
              isCreate = false;
            }
          });

          rooms.forEach((room) => {
            const joinEmployees = room.join_employees.filter(
              (empId) => empId !== employeeId
            );
            const newRoom = {
              ...room,
              join_employees: [...joinEmployees]
            };
            newRooms.push(newRoom);
          });

          newRooms = newRooms.filter((room) => room.join_employees.length > 1);

          if (isCreate) {
            const roomId = getId();
            newRooms.push({
              room_id: roomId,
              x_coordinate: roomX,
              y_coordinate: roomY,
              join_employees: joinEmployees
            });
          }
          transaction.update(roomCollectionRef, {
            rooms: newRooms
          });
        }
      });
    })
    .then(() => res.json({ message: "success" }))
    .catch((e) => res.json({ message: "failed", e: e }));
});
//////////////////////////////////////////////
router.route(endPoint).put((req, res) => {
  const body = JSON.parse(req.body.data) as PutRequest;
  const { officeId, overlapRoomIds, employeeId } = body;
  let newRooms: Room[] = [];
  let isCreate = true;
  db.runTransaction(async (transaction) => {
    const roomCollectionRef = db
      .collection("offices")
      .doc(officeId)
      .collection("room")
      .doc("room");

    await transaction.get(roomCollectionRef).then(async (snapshot) => {
      const data = snapshot.data();
      let rooms: Room[];
      if (data) {
        rooms = data.rooms;
        if (rooms.length == 0) isCreate = false;

        if (overlapRoomIds) {
          rooms.forEach((element) => {
            const room: Room = element;
            let newRoom: Room = {
              room_id: "",
              x_coordinate: 0,
              y_coordinate: 0,
              join_employees: []
            };

            overlapRoomIds.forEach((id) => {
              if (room.room_id === id) {
                newRoom = {
                  ...room,
                  join_employees: [...room.join_employees, employeeId]
                };
              } else {
                const newJoinEmployees = room.join_employees.filter(
                  (empId) => empId !== employeeId
                );
                newRoom = {
                  ...room,
                  join_employees: newJoinEmployees
                };
              }
            });

            newRooms.push(newRoom);
          });
        } else {
          rooms.forEach((element) => {
            const room: Room = element;
            let newRoom: Room = {
              room_id: "",
              x_coordinate: 0,
              y_coordinate: 0,
              join_employees: []
            };

            const newJoinEmployees = room.join_employees.filter(
              (empId) => empId !== employeeId
            );
            newRoom = {
              ...room,
              join_employees: newJoinEmployees
            };

            newRooms.push(newRoom);
          });
        }

        if (isCreate) {
          newRooms = newRooms.filter((room) => room.join_employees.length > 1);
          transaction.update(roomCollectionRef, {
            rooms: newRooms
          });
        }
      }
    });
  })
    .then(() => res.json({ newRooms: newRooms, isCreate: isCreate }))
    .catch((e) => res.json({ message: "failed", e: e }));
});

export { router as roomRouter };
//module.exports = router;
