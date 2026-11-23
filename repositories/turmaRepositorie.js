import Turma from "../models/turmaModel.js";

const createTurma = async (req, res) => {
    const newTurma = req.body;

    try {
        const turmaDB = await Turma.create(newTurma);
        res.json({ success: true, data: turmaDB })
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const getTurma = async (req, res) => {
    const {turma} = req.params;

    try {
        if(turma){
            const turmaDB = await Turma.findByPk(turma);
            res.json({ success: true, data: turmaDB })
        } else {
            const allTurmaDB = await Turma.findAll();
            res.json({ success: true, data: allTurmaDB })
        }
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

export {
    createTurma,
    getTurma
}