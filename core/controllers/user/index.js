'use strict';
const bcrypt = require('bcrypt')
const getHash = require('./hash')

const makeJWT = require('./getjwt')

const hashPasswordController = () => {
    return async (prev, req) => {
        const password = req.body.password
        req.hash = await getHash(password)
        return prev
    }
}

const createUserController = (Model) => {
    return async (prev, req) => {

        if (!req.hash) {
            console.log('hash must be calculated and placed inside request object')
            return {
                http_code: 400,
                message: "system error",
                result: null
            }
        }

        const {login} = req.body

        const existing = await Model.findOne({where: {login}})

        if (existing) {
            return {
                http_code: 400,
                message: "Пользователь с таким логином уже существует",
                result: "existing user"
            }
        }

        await Model.create({login, password: req.hash})

        return {
            http_code: 200,
            message: "Пользователь зарегистрирован",
            result: "success"
        }
    }
}

const getUserController = (Model) => {
    return async (_, req) => {
        const {login, password} = req.body
        const user = await Model.findOne({where: {login}})

        if (!user) {
            return {
                message: `Нет пользователя с таким логином: ${login}`,
                result: "user not found",
                http_code: 404,
                break: true
            }
        }

        if (!password) {
            return {
                message: 'Введите пароль',
                result: 'wrong password',
                http_code: 403,
                break: true
            }
        }

        if (! (await bcrypt.compare(password, user.password))) {
            return {
                message: 'Пароль неверный',
                result: 'wrong password',
                http_code: 403,
                break: true
            }
        }

        req.currentUser = user

        return {
            result: 'user authenticated',
            http_code: 200
        }
    }
}

const getJWTController = () => {
    return async (_, req) => {
        if (!req.currentUser) {
            console.log('currentUser must be get and placed inside request object')
            return {
                http_code: 400,
                result: "system error"
            }
        }

        const {id} = req.currentUser

        req.currentUser.lastToken += 1
        await req.currentUser.save()

        const jwt = await makeJWT(id, req.currentUser.lastToken)

        return {
            result: {
                jwt
            },
            message: "Аутентификация прошла успешно",
            http_code: 200
        }
    }
}

const logoutController = () => {
    return async (_, req) => {
        const user = req.currentUser
        // Выставляем номер последнего валидного токена, т.о все токены, выданные ранее становятся невалидны
        user.validTokenNumber = user.lastToken + 1
        await user.save()
        return {
            http_code: 200,
            result: 'success',
            message: 'Все сессии сброшены'
        }
    }
}

const deleteUserController = (Model) => {
    return async (_, req) => {
        const user = req.currentUser
        await Model.destroy({where: {id: user.id}})
        return {
            http_code: 200,
            result: 'success',
            message: 'Пользователь удален'
        }
    }
}

module.exports = (Model) => {
    return {
        hashPasswordController: hashPasswordController(),
        createUserController: createUserController(Model),
        getUserController: getUserController(Model),
        getJWTController: getJWTController(),
        logoutController: logoutController(),
        deleteUserController: deleteUserController(Model)
    }
}