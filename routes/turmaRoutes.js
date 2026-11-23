import express from 'express';
import { alterUser, createUser, deleteUser, getAll, getByName, getOne, login } from '../repositories/turmaUserRepositorie.js';
import { createTurma, getTurma } from '../repositories/turmaRepositorie.js';
import { getAllStudentsByTurma, getAllTurmasByStudent, matricularAluno } from '../repositories/matricula.js';
import { authenticate } from '../middleware/turmaAuthenticate.js';

const router = express.Router();

router.route("/v1/user").post(createUser);
router.route("/v1/user").get(authenticate, getAll);
router.route("/v1/user/:name").get(getByName);
router.route("/v1/user/id/:user").get(getOne).put(alterUser).delete(deleteUser);

router.route("/v1/turma").post(createTurma);
router.route("/v1/turma{/:turma}").get(getTurma);
router.route("/v1/turma/turma").put(createUser).delete(createUser);

router.route("/v1/matricula/:user/:turma").post(matricularAluno).delete(createUser);
router.route("/v1/matricula/turma/:turma").get(getAllStudentsByTurma);
router.route("/v1/matricula/user/:user").get(getAllTurmasByStudent);

router.route("/v1/login").post(login);

export default router;