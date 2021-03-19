require('dotenv').config()

const getUserControllers = require('../token')
const makeJWT = require('../user/getjwt')

class FakeModel {

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
}

const getFakeReq = (token) => {
    return {
        originalUrl: 'url',
        header(name) {
            if (name === 'auth-token') return token
        }
    }
}


describe('Тесты контроллера проверки jwt токенов', () => {

    let verifyTokenHandler = getUserControllers(FakeModel).verifyToken

    const fakeRes = {
        result: null,
        status() {
            return fakeRes
        },
        json(result) {
            fakeRes.result = result
            return fakeRes
        }
    }

    let nextWasCalled = false

    const fakeNext = () => {
        nextWasCalled = true
    }

    beforeEach(() => {
        fakeRes.result = null
        nextWasCalled = false
    })


    it('Отсутствие токена', async () => {
        await verifyTokenHandler(getFakeReq(false), fakeRes, fakeNext)
        expect(fakeRes.result).toStrictEqual({
            result: 'token required',
            message: 'Неавторизованный запрос',
            err: true
        })
        expect(nextWasCalled).toBeFalsy()
    })

    it('Некорректный токен', async () => {
        await verifyTokenHandler(getFakeReq('000000000000000000'), fakeRes, fakeNext)
        expect(fakeRes.result).toStrictEqual({
            result: "JWT Error",
            message: "Ошибка токена",
            err: true
        })
        expect(nextWasCalled).toBeFalsy()
    })

    it('Токен с несуществующим id пользователя', async () => {
        await verifyTokenHandler(getFakeReq(makeJWT(2, 3)), fakeRes, fakeNext)
        expect(fakeRes.result).toStrictEqual({
            result: "JWT Error",
            message: "Ошибка токена",
            err: true
        })
        expect(nextWasCalled).toBeFalsy()
    })

    it('Корректный токен', async() => {
        await verifyTokenHandler(getFakeReq(makeJWT(1, 4)), fakeRes, fakeNext)
        expect(fakeRes.result).toBeNull()
        expect(nextWasCalled).toBeTruthy()
    })


    it('Номер токена заблокирован', async() => {
        await verifyTokenHandler(getFakeReq(makeJWT(1, 1)), fakeRes, fakeNext)
        expect(fakeRes.result).toStrictEqual({
            result: "JWT Error",
            message: "Ошибка токена",
            err: true
        })
        expect(nextWasCalled).toBeFalsy()
    })
})