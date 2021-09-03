import * as Express from "express";
import { db, fieldValue } from "../../../admin";
import {
  judgeLargerTarget,
  judgeSameTarget,
  judgeSmallerTarget
} from "../../utils/judgeOverlap";

const express = Express;
const router = express.Router();
const endPoint = "/furniture";
const FURNITURESIZE = 100;

type PostRequest = {
  officeId: string;
  furnitureName: string;
  furnitureDetail: string;
  furnitureSize: number;
  isClose: boolean;
  furnitureColor: "white" | "black" | "red" | "blue" | "yellow" | "green";
  authorities: string[];
  xCoordinate: number;
  yCoordinate: number;
};
type EnterExit = {
  type: "enterExit";
  officeId: string;
  employeeId: string;
  furnitureId: string | string[];
};
type UpdateFurniture = {
  type: "updateFurniture";
  officeId: string;
  furnitureId: string;
  furnitureName: string;
  furnitureDetail: string;
  furnitureSize: number;
  isClose: boolean;
  furnitureColor: "white" | "black" | "red" | "blue" | "yellow" | "green";
  authorities: string[];
  xCoordinate: number;
  yCoordinate: number;
};
type PutRequest = EnterExit | UpdateFurniture;

type Furniture = {
  room_id: string;
  furniture_name: string;
  furniture_detail: string;
  furniture_size: number;
  is_close: boolean;
  furniture_color: "white" | "black" | "red" | "blue" | "yellow" | "green";
  authorities: string[];
  join_employees: string[];
  x_coordinate: number;
  y_coordinate: number;
};

type UpdateFurnitureInfo = {
  furnitureId: string;
  furnitureName: string;
  furnitureDetail: string;
  furnitureSize: number;
  isClose: boolean;
  furnitureColor: "white" | "black" | "red" | "blue" | "yellow" | "green";
  authorities: string[];
  xCoordinate: number;
  yCoordinate: number;
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
  const {
    officeId,
    furnitureName,
    furnitureDetail,
    furnitureSize,
    isClose,
    furnitureColor,
    authorities,
    xCoordinate,
    yCoordinate
  } = body;

  const judgeOverlapFurniture = (furnitureList: Furniture[]) => {
    //xCoordinate:509,yCoordinate:553
    let isOverlap = false;
    const ownStartX = xCoordinate;
    const ownStartY = yCoordinate;
    const ownEndX = ownStartX + furnitureSize * FURNITURESIZE;
    const ownEndY = ownStartY + furnitureSize * FURNITURESIZE;
    const ownInfo = {
      ownStartX: ownStartX,
      ownStartY: ownStartY,
      ownEndX: ownEndX,
      ownEndY: ownEndY
    };

    for (const furniture of furnitureList) {
      const targetInfo = {
        xCoordinate: furniture.x_coordinate,
        yCoordinate: furniture.y_coordinate,
        size: furniture.furniture_size * FURNITURESIZE
      };
      if (isOverlap) break;

      if (furniture.furniture_size < furnitureSize) {
        isOverlap = judgeLargerTarget(ownInfo, targetInfo);
      } else if (furniture.furniture_size === furnitureSize) {
        isOverlap = judgeSameTarget(ownInfo, targetInfo);
      } else {
        isOverlap = judgeSmallerTarget(ownInfo, targetInfo);
      }
    }

    return isOverlap;
  };

  await db
    .runTransaction(async (transaction) => {
      const furnitureCollectionRef = db
        .collection("offices")
        .doc(officeId)
        .collection("furniture");

      const existFurnitureList: Furniture[] = [];
      let isCreate = true;

      await transaction.get(furnitureCollectionRef).then(async (snapshots) => {
        snapshots.forEach((snapshot) => {
          existFurnitureList.push(snapshot.data() as Furniture);
        });
      });
      if (existFurnitureList.length !== 0) {
        isCreate = judgeOverlapFurniture(existFurnitureList);
      }
      if (isCreate) {
        const roomId = getId();
        transaction.set(furnitureCollectionRef.doc(), {
          room_id: roomId,
          furniture_name: furnitureName,
          furniture_detail: furnitureDetail,
          furniture_size: furnitureSize,
          is_close: isClose,
          furniture_color: furnitureColor,
          authorities: authorities,
          x_coordinate: xCoordinate,
          y_coordinate: yCoordinate,
          join_employees: []
        });
      }
    })
    .then(() => res.json({ message: "success" }))
    .catch((e) => res.json({ message: "failed", e: e }));
});
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

const joinFurniture = async (
  officeId: string,
  employeeId: string,
  furnitureId: string
) => {
  const furnitureRef = db
    .collection("offices")
    .doc(officeId)
    .collection("furniture")
    .doc(furnitureId);

  let result = true;
  console.log("start");
  await db
    .runTransaction(async (transaction) => {
      transaction.update(furnitureRef, {
        join_employees: fieldValue.arrayUnion(employeeId)
      });
    })
    .then(() => {
      console.log("joinFurniture 成功");
      result = true;
    })
    .catch((e) => {
      console.log("joinFurniture 失敗", e);
      result = false;
    });
  return result;
};

const exitFurniture = async (
  officeId: string,
  employeeId: string,
  furnitureId: string[]
): Promise<boolean> => {
  const result = await db
    .runTransaction(async (transaction) => {
      const joinFurnitureList = furnitureId;
      joinFurnitureList.forEach((furnitureId) => {
        const deleteRef = db
          .collection("offices")
          .doc(officeId)
          .collection("furniture")
          .doc(furnitureId);
        transaction.update(deleteRef, {
          join_employees: fieldValue.arrayRemove(employeeId)
        });
      });
    })
    .then(() => {
      return true;
    })
    .catch((e) => {
      return false;
    });
  return result;
};

const updateFurniture = async (
  officeId: string,
  furniture: UpdateFurnitureInfo
) => {
  const result = await db
    .runTransaction(async (transaction) => {
      const furnitureRef = db
        .collection("offices")
        .doc(officeId)
        .collection("furniture")
        .doc(furniture.furnitureId);
      transaction.update(furnitureRef, {
        furniture_name: furniture.furnitureName,
        furniture_detail: furniture.furnitureDetail,
        furniture_size: furniture.furnitureSize,
        is_close: furniture.isClose,
        furniture_color: furniture.furnitureColor,
        authorities: furniture.authorities,
        x_coordinate: furniture.xCoordinate,
        y_coordinate: furniture.yCoordinate
      });
    })
    .then(() => {
      return true;
    })
    .catch((e) => {
      return false;
    });
  return result;
};

router.route(endPoint).put(async (req, res) => {
  const body = JSON.parse(req.body.data) as PutRequest;
  let response: boolean;
  switch (body.type) {
    case "enterExit":
      if (!Array.isArray(body.furnitureId)) {
        response = await joinFurniture(
          body.officeId,
          body.employeeId,
          body.furnitureId
        );
      } else {
        response = await exitFurniture(
          body.officeId,
          body.employeeId,
          body.furnitureId
        );
      }
      break;
    case "updateFurniture":
      response = await updateFurniture(body.officeId, {
        furnitureId: body.furnitureId,
        furnitureName: body.furnitureName,
        furnitureDetail: body.furnitureDetail,
        furnitureSize: body.furnitureSize,
        isClose: body.isClose,
        furnitureColor: body.furnitureColor,
        authorities: body.authorities,
        xCoordinate: body.xCoordinate,
        yCoordinate: body.yCoordinate
      });
      break;
  }
  res.json(response);
});

export { router as furnitureRouter };
//module.exports = router;
