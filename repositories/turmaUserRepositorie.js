import User from "../models/turmaUserModel.js";
import bcrypt from "bcrypt";

const createUser = async (req, res) => {
    const user = req.body;

    try {
        const userDB = await User.create(user);
        res.json({ sucess: true, data: userDB });
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const getAll = async (req, res) => {
    try {
        const allUsers = await User.findAll();
        res.json({ success: true, data: allUsers });
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const getOne = async (req, res) => {
    const { user } = req.params;

    try {
        const userDB = await User.findByPk(user);
        res.json({ success: true, data: userDB })
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const getByName = async (req, res) => {
    const { name } = req.params;

    try {
        const userDB = await User.findOne({ where: { firstName: name } });
        res.json({ success: true, data: userDB })
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const alterUser = async (req, res) => {
    const { user } = req.params
    const newData = req.body

    try {
        const userDB = await User.update(newData, { where: { id: user } });
        res.json({ success: true, data: userDB })
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const deleteUser = async (req, res) => {
    const { user } = req.params

    try {
        const userDB = await User.destroy({ where: { id: user } });
        res.json({ success: true, data: userDB })
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

const login = async (req, res) => {
    const { email, password } = req.params

    try {
        const userDB = await User.destroy({ where: { email: email } });
        if (!user) {
            res.json({ success: false, message: "usuario não esta cadastrado" })
        } 

        const logado = await bcrypt.compare(password, user.password);

        if (!logado) return res.json({success: false, message: "senha esta incorreta"});

        res.json({success: true, message: "login efetuado com sucesso"})
    } catch (error) {
        res.json({ success: false, data: { message: error.message } })
    }
}

export {
    createUser,
    getAll,
    getOne,
    getByName,
    alterUser,
    deleteUser,
    login
}