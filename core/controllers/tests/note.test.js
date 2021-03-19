require('dotenv').config()
const getNoteControllers = require('../note')


class FakeModel {

    static created = null
    static saved = null
    static destroyed = null

    constructor() {
        this.id = 1
        this.text = 'text'
    }


    static async findByPk(pk) {
        if (pk === 1) {
            return new FakeModel()
        }
        return null
    }

    static async findOne(opt) {
        if (opt.where && opt.where.id === 1 && opt.where.userId === 1) {
            return new FakeModel()
        }
        return null
    }

    static async findAll(opt) {
        const res = []
        res.push(new FakeModel())
        res.push(new FakeModel())
        res.push(new FakeModel())
        res.push(new FakeModel())
        res.map(item => item.userId = opt.where.userId)
        const offset = opt.offset || 0
        const limit = opt.limit || res.length
        return res.slice(offset, limit + offset)
    }

    static async count() {
        return 4
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

const noteControllers = getNoteControllers(FakeModel)


describe('Контроллер получения заметки', () => {

    const getNote = noteControllers.getNote


    it('Несуществующий id заметки', async () => {
        const result = await getNote(null, {params: {id: 2}, currentUser: {id: 1}})
        expect(result).toStrictEqual({
            http_code: 404,
            result: 'not found',
            message: `Не найдена запись с id=2`,
            break: true
        })
    })

    it('Заметка не принадлежит текущему пользователю', async () => {
        const result = await getNote(null, {params: {id: 1}, currentUser: {id: 2}})
        expect(result).toStrictEqual({
            http_code: 404,
            result: 'not found',
            message: `Не найдена запись с id=1`,
            break: true
        })
    })

    it('Получение заметки', async() => {
        const fakeReq = {params: {id: 1}, currentUser: {id: 1}}
        const result = await getNote(null, fakeReq)
        expect(result).toStrictEqual({
            result: 'success',
            message: 'Найдена запись',
            http_code: 200
        })
        expect(fakeReq.note).toBeTruthy()
        expect(fakeReq.note.text).toBe('text')
    })


})

describe('Контроллер создания заметки', () => {

    const addNoteController = noteControllers.addNoteController

    beforeEach(() => {
        FakeModel.created = null
    })

    it('Создание заметки', async () => {
        const fakeReq = {body: {text: 'fake'}, currentUser: {id: 10}}
        const result = await addNoteController(null, {body: {text: 'fake'}, currentUser: {id: 10}})
        expect(result).toStrictEqual({
            http_code: 200,
            result: "success",
            message: "Заметка создана"
        })
        expect(FakeModel.created).toStrictEqual({text: fakeReq.body.text, userId: fakeReq.currentUser.id})
    })

})

describe("Получение списка заметок", () => {

    const getManyNotesController = noteControllers.getManyNotesController

    it('Отсутствует полученный currentUser', async () => {
        const result = await getManyNotesController(null, {query: {}})
        expect(result).toStrictEqual({
            http_code: 400,
            result: "system error"
        })
    })

    it('Неверные параметры limit и offset', async () => {
        const result = await getManyNotesController(null, {query: {limit: 'a', offset: 'b'}, currentUser: {id: 1}})
        expect(result).toStrictEqual({
            result: 'wrong parameters',
            http_code: 400,
            message: 'Неверные парамеры кол-ва и смещения. Например ?limit=10&offset=10'
        })
    })

    it('Получение заметок без параметров', async () => {
        const result = await getManyNotesController(null, {query: {}, currentUser: {id: 1}})
        expect(result.result.length).toBe(4)
        expect(result.result[0].text).toBe('text')
        expect(result.result[0].userId).toBe(1)
        expect(result.count).toBe(4)
        expect(result.http_code).toBe(200)
    })

    it('Получение заметок с параметрами', async () => {
        const result = await getManyNotesController(null, {query: {limit: 2, offset: 1}, currentUser: {id: 1}})
        expect(result.result.length).toBe(2)
        expect(result.result[0].text).toBe('text')
        expect(result.result[0].userId).toBe(1)
        expect(result.count).toBe(4)
        expect(result.http_code).toBe(200)
    })

})

describe('Редактирование заметки', () => {
    const editNoteController  = noteControllers.editNoteController

    it('Не найдена предварительно искомая заметка', async () => {
        const result = await editNoteController(null, {body: {text: 'note2'}})
        expect(result).toStrictEqual({
            result: "system error",
            http_code: 500,
        })
    })

    it('Успешное редактирование', async () => {
        const note = new FakeModel()
        FakeModel.saved = null
        const result = await editNoteController(null, {note, body: {text: 'note2'}})
        expect(result).toStrictEqual({
            message: "Заметка изменена",
            result: 'success',
            http_code: 200
        })
        expect(note.text).toBe('note2')
        expect(FakeModel.saved.text).toBe('note2')
    })
});

describe('Удаление заметки', async () => {
    const deleteNoteController = noteControllers.deleteNoteController

    it('Не найдена предварительно искомая заметка', async () => {
        const result = await deleteNoteController(null, {})
        expect(result).toStrictEqual({
            result: "system error",
            http_code: 500,
        })
    })

    it('Успешное удаление', async () => {
        const note = new FakeModel()
        FakeModel.destoyed = null
        const result = await deleteNoteController(null, {note})
        expect(result).toStrictEqual({
            http_code: 200,
            result: 'success',
            message: 'Заметка удалена'
        })
        expect(FakeModel.destoyed).toStrictEqual({where: {id: note.id}})
    })

})

describe('Расшаривание заметки', async () => {
    const shareNoteController = noteControllers.shareNoteController

    it('Не найдена предварительно искомая заметка', async () => {
        const result = await shareNoteController(null, {})
        expect(result).toStrictEqual({
            result: "system error",
            http_code: 500,
        })
    })

    it('Успешное расшарена', async () => {
        const note = new FakeModel()
        FakeModel.saved = null
        const result = await shareNoteController(null, {note, currentUser: {id: 2}})
        expect(result).toStrictEqual({
            result: {
                url: `/note/2/share/${note.sharedKey}`
            },
            message: "Заметка расшарена",
            http_code: 200
        })
        expect(FakeModel.saved.sharedKey).toBe(note.sharedKey)
    })

})