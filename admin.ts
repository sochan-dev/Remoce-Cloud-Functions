import admin from "firebase-admin";
import dotenv from "dotenv";
import functions = require("firebase-functions");
import serviceKey from "./serviceKey.json";

dotenv.config();
const cert = {
  projectId: serviceKey.project_id,
  clientEmail: serviceKey.client_email,
  privateKey: serviceKey.private_key.replace(/\\n/g, "\n")
};
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cert),
    databaseURL: "https://remoce-7a22f-default-rtdb.firebaseio.com"
  });
}

export const db = admin.firestore();
export const database = admin.database();
export const fieldValue = admin.firestore.FieldValue;
export const cf = functions;
