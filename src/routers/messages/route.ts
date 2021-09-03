import * as Express from "express";

const express = Express;
const router = express.Router();
const endPoint = "/messages";
type PostRequest = {
  roomX: string;
  roomY: string;
  officeId: string;
};

router
  .route(endPoint)
  .get((req, res) => {
    res.json({ message: "hello re cache!!!!" });
  })
  .post((req, res) => {
    const { officeId } = req.body as PostRequest;
    res.json({ message: `hello post f${officeId}` });
  });

router
  .route(`${endPoint}/:id`)
  .put((req, res) => {
    res.json({ message: `hello put ${req.params.id}` });
  })
  .delete((req, res) => {
    res.json({ message: `hello delete ${req.params.id}` });
  });

export { router as messageRouter };
//module.exports = router;
