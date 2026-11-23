import User from "./turmaUserModel.js";
import Turma from "./turmaModel.js"

User.belongsToMany(Turma, { through: 'User_Turmas' });
Turma.belongsToMany(User, { through: 'User_Turmas' });

export {
    User,
    Turma
}