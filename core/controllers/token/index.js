'use strict';
const jwt = require('jsonwebtoken')

const verifyTokenController = (Model) => {
    return async (req, res, next) => {
        const token = req.header('auth-token')

        if (!token) {
            console.error(`request:${req.originalUrl} without authorization token`)
            res.status(403).json({
                result: "token required",
                message: "Неавторизованный запрос",
                err: true
            })
            return
        }

        try {
            let verified
            try {
                verified = jwt.verify(token, process.env.TOKEN_SECRET)
            } catch (error) {
                console.error(error.message)
                res.status(403).json({
                    result: "JWT Error",
                    message: "Ошибка токена",
                    err: true
                })
                return
            }

            const user = await Model.findByPk(verified.id)

            if (!user) {
                console.error(`request:${req.originalUrl}. No such user with id built in jwt token found`)
                res.status(403).json({
                    result: "JWT Error",
                    message: "Ошибка токена",
                    err: true
                })
                return
            }

            // Проверка на то, что токен не был отозван
            if (user.validTokenNumber && user.validTokenNumber > verified.tokenNumber) {
                console.error(`request:${req.originalUrl}. token forbidden`)
                res.status(403).json({
                    result: "JWT Error",
                    message: "Ошибка токена",
                    err: true
                })
                return
            }

            console.log(`request:${req.originalUrl} user:${user.login} authorized`)

            req.currentUser = user

            next()

        } catch (e) {
            console.error(e)
            res.status(403).json({
                result: 'exception',
                message: e.message,
                err: true
            })
        }
    }
}

module.exports = (Model) => {
    return {
        verifyToken: verifyTokenController(Model)
    }
}