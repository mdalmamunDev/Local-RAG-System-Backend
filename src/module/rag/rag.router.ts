import { upload } from "../../utils/multter";
import { RagController } from "./rag.controller";
import { Router } from "express";


const ragRouter = Router();

ragRouter.post('/documents', upload.single("file"), RagController.insertDocument);
ragRouter.get('/documents', RagController.listDocuments);
ragRouter.delete('/documents/:id', RagController.deleteDocument);
ragRouter.post('/chat',  RagController.chat);

export default ragRouter;