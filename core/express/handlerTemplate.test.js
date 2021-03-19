const apiHandler = require('./handlerTemplate')


describe("Шаблонный обработчик запросов", () => {

    const fakeRes = {
        res: null,
        code: null,
        status(code) {
            fakeRes.code = code
            return fakeRes
        },
        json(data) {
            fakeRes.res = data
        }
    }

    beforeEach(() => {
        fakeRes.res = null
        fakeRes.code = null
    })

    it('Возвращение кода ошибки с сообщением', async() => {

        const handler = apiHandler(() => ({http_code: 400, message: 'message', result: 'result'}))
        await handler({}, fakeRes)
        expect(fakeRes.res).toStrictEqual({message: 'message', result: 'result', err: true})
        expect(fakeRes.code).toBe(400)
    })

    it('Нет message и result в возвращаемом объекте обработчика', async () => {
        const handler = apiHandler(() => ({http_code: 400}))
        await handler({}, fakeRes)
        expect(fakeRes.res).toStrictEqual({
            message: "Unknown result",
            err: true
        })
        expect(fakeRes.code).toBe(500)
    })

    it('Выдача успешного результата', async () => {
        const handler = apiHandler(() => ({http_code: 200, message: 'message', result: 'result', count: 1}))
        await handler({}, fakeRes)
        expect(fakeRes.res).toStrictEqual({message: 'message', result: 'result', count: 1, err: false})
        expect(fakeRes.code).toBe(200)
    })

    it('Несколько обработчиков', async () => {
        const handler = apiHandler([
            () => ({http_code: 200, message: 'message', result: 'result'}),
            () => ({http_code: 200, message: 'message1', result: 'end', count: 1})
        ])
        await handler({}, fakeRes)
        expect(fakeRes.res).toStrictEqual({message: 'message1', result: 'end', count: 1, err: false})
        expect(fakeRes.code).toBe(200)
    })

    it('несколько обработчиков с прерывание цепочки', async () => {
        const handler = apiHandler([
            () => ({http_code: 400, message: 'message', result: 'result', break: true}),
            () => ({http_code: 200, message: 'message1', result: 'end', count: 1})
        ])
        await handler({}, fakeRes)
        expect(fakeRes.res).toStrictEqual({message: 'message', result: 'result', err: true})
        expect(fakeRes.code).toBe(400)
    })

})