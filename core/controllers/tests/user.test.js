require('dotenv').config()
const jwt = require('jsonwebtoken')
const getUserControllers = require('../user')
const getHash = require('../user/hash')


class FakeModel {

    static created = null
    static saved = null
    static destroyed = null

    constructor() {
        this.login = 'login'
        this.password = 'password'
        this.lastToken = 0
        this.createdAt = new Date()
        this.updatedAt = new Date()
        this.validTokenNumber = 2 // Все токены с номером меньше 3 запрещены
    }


    static async findByPk(pk) {
        if (pk === 1) {
            return new FakeModel()
        }
        return null
    }

    static async findOne(opt) {
        if (opt.where && opt.where.login === 'user1') {
            const user = new FakeModel()
            user.password = await getHash('pass')
            return user
        }
        return null
    }

    static async create(data) {
        FakeModel.created = data
    }

    async save() {
        FakeModel.saved = this
    }

    static async destroy(data) {
        FakeModel.destoyed = data
    }
}

const userControllers = getUserControllers(FakeModel)


describe('Контроллер регистрации пользователя', () => {

    const createUser = userControllers.createUserController

    let fakeReqExist
    let fakeReqNotExist

    beforeEach(async () => {
        FakeModel.created = null
        fakeReqExist = {
            hash: await getHash('123'),
            body: {login: 'user1'}
        }
        fakeReqNotExist = {
            hash: await getHash('123'),
            body: {login: 'user2'}
        }
    })

    it('Хэш пароля предварительно не вычислен', async () => {
        const result = await createUser(null, {})
        expect(result).toStrictEqual({
            http_code: 400,
            message: "system error",
            result: null
        })
        expect(FakeModel.created).toBeNull()
    })

    it('Пользователь с таким логином уже существует', async () => {
        const result = await createUser(null, fakeReqExist)
        expect(result).toStrictEqual({
            http_code: 400,
            message: "Пользователь с таким логином уже существует",
            result: "existing user"
        })
        expect(FakeModel.created).toBeNull()
    })

    it('Успешная регистрация', async () => {
        const result = await createUser(null, fakeReqNotExist)
        expect(result).toStrictEqual({
            http_code: 200,
            message: "Пользователь зарегистрирован",
            result: "success"
        })
        expect(FakeModel.created).toStrictEqual({login: fakeReqNotExist.body.login, password: fakeReqNotExist.hash})
    })

})

describe('Контроллер авторизации пользователя', () => {
    const getUser = userControllers.getUserController

    let fakeReqExist
    let fakeReqNotExist

    beforeEach(async () => {
        FakeModel.created = null
        fakeReqExist = {
            hash: await getHash('123'),
            body: {login: 'user1'}
        }
        fakeReqNotExist = {
            hash: await getHash('123'),
            body: {login: 'user2'}
        }
    })

    it('Пользователя не существует', async () => {
        const result = await getUser(null, fakeReqNotExist)
        expect(result).toStrictEqual({
            message: `Нет пользователя с таким логином: ${fakeReqNotExist.body.login}`,
            result: "user not found",
            http_code: 404,
            break: true
        })
    })

    it('Нет пароля', async () => {
        const result = await getUser(null, fakeReqExist)
        expect(result).toStrictEqual({
            message: 'Введите пароль',
            result: 'wrong password',
            http_code: 403,
            break: true
        })
    })

    it('Пароль неверный', async () => {
        fakeReqExist.body.password = '123'
        const result = await getUser(null, fakeReqExist)
        expect(result).toStrictEqual({
            message: 'Пароль неверный',
            result: 'wrong password',
            http_code: 403,
            break: true
        })
    })

    it('Успешная авторизация', async () => {
        fakeReqExist.body.password = 'pass'
        const result = await getUser(null, fakeReqExist)
        expect(result).toStrictEqual({
            result: 'user authenticated',
            http_code: 200
        })
        expect(fakeReqExist.currentUser).toBeTruthy()
    })
})

describe('Получение JWT токена', async () => {
    const getJWTController = userControllers.getJWTController

    let fakeReq

    beforeEach(async () => {
        FakeModel.saved = null
        const user = new FakeModel()
        user.id = 1
        user.lastToken = 1
        fakeReq = {
            currentUser: user
        }
    })

    it('Пользователь не был найден', async () => {
        const result = await getJWTController(null, {})
        expect(result).toStrictEqual({
            http_code: 400,
            result: "system error"
        })
    })

    it('Получение токена', async () => {
        const result = await getJWTController(null, fakeReq)
        const token = result.result.jwt

        const {id, tokenNumber} = jwt.verify(token, process.env.TOKEN_SECRET)
        expect(id).toBe(1)
        expect(tokenNumber).toBe(2)
        expect(fakeReq.currentUser.lastToken).toBe(2)
        expect(FakeModel.saved.lastToken).toBe(2)
    })

})

describe('Сброс сессий пользователя', () => {

    const logoutController = userControllers.logoutController

    let fakeReq

    beforeEach(async () => {
        FakeModel.saved = null
        const user = new FakeModel()
        user.id = 1
        user.lastToken = 1
        fakeReq = {
            currentUser: user
        }
    })

    it('Установление флага validTokenNumber', async () => {
        const result = await logoutController(null, fakeReq)
        expect(result).toStrictEqual({
            http_code: 200,
            result: 'success',
            message: 'Все сессии сброшены'
        })
        expect(FakeModel.saved.validTokenNumber).toBe(2)
    })
})

describe('Удаление пользователя', () => {
    const deleteUserController = userControllers.deleteUserController

    let fakeReq

    beforeEach(async () => {
        FakeModel.destoyed = null
        const user = new FakeModel()
        user.id = 1
        user.lastToken = 1
        fakeReq = {
            currentUser: user
        }
    })

    it('Удаление', async () => {
        const result = await deleteUserController(null, fakeReq)
        expect(result).toStrictEqual({
            http_code: 200,
            result: 'success',
            message: 'Пользователь удален'
        })
        expect(FakeModel.destoyed).toStrictEqual({where: {id: 1}})
    })
})