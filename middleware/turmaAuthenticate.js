import jwt from "jsonwebtoken";

const authenticate = (req, res, next) =>{
    const token = req.cookie;

    console.log(token)
    next()
}

export {
    authenticate
}