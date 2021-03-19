'use strict';
const generateToken = require('./cryptotoken')


const getNoteController = (Model) => {
    return async (_, req) => {
        const {id} = req.params
        const note = await Model.findOne({where: {id, userId: req.currentUser.id}})
        if (!note) {
            return {
                http_code: 404,
                result: 'not found',
                message: `Не найдена запись с id=${id}`,
                break: true
            }
        }
        req.note = note
        return {
            result: 'success',
            message: 'Найдена запись',
            http_code: 200
        }
    }
}

const addNoteController = (Model) => {
    return async (_, req) => {

        if (!req.currentUser) {
            console.log('currentUser must be get and placed inside request object')
            return {
                http_code: 400,
                result: "system error"
            }
        }

        const {text} = req.body
        const user = req.currentUser
        await Model.create({text: text.slice(0, 1000), userId: user.id})
        return {
            http_code: 200,
            result: "success",
            message: "Заметка создана"
        }
    }
}

const getManyNotesController = (Model) => {
    return async (_, req) => {

        const {limit: sLimit, offset: sOffset} = req.query

        if (!req.currentUser) {
            console.log('currentUser must be get and placed inside request object')
            return {
                http_code: 400,
                result: "system error"
            }
        }

        const limit = sLimit ? parseInt(sLimit): undefined
        const offset = sOffset ? parseInt(sOffset): undefined

        if (sLimit && isNaN(limit) || sOffset && isNaN(offset)) {
            return {
                result: 'wrong parameters',
                http_code: 400,
                message: 'Неверные парамеры кол-ва и смещения. Например ?limit=10&offset=10'
            }
        }

        const notes = await Model.findAll({limit, offset, order: [["updatedAt", "DESC"]], where: {userId: req.currentUser.id}})
        const count = await Model.count({where: {userId: req.currentUser.id}})
        return {
            http_code: 200,
            result: notes,
            message: "Успешно получены",
            count
        }
    }
}

const editNoteController = () => {
    return async (_, req) => {
        const {text} = req.body
        const note = req.note
        if (!note) {
            return {
                result: "system error",
                http_code: 500,
            }
        }
        note.text = text
        note.updatedAt = new Date()
        await note.save()
        return {
            message: "Заметка изменена",
            result: 'success',
            http_code: 200
        }
    }
}

const deleteNoteController = (Model) => {
    return async (_, req) => {
        const note = req.note
        if (!note) {
            return {
                result: "system error",
                http_code: 500,
            }
        }
        await Model.destroy({where: {id: note.id}})
        return {
            http_code: 200,
            result: 'success',
            message: 'Заметка удалена'
        }
    }
}

const shareNoteController = () => {
    return async (_, req) => {
        const note = req.note
        if (!note) {
            return {
                result: "system error",
                http_code: 500,
            }
        }
        note.sharedKey = generateToken()
        note.shared = true
        await note.save()

        return {
            result: {
                url: `/note/${req.currentUser.id}/share/${note.sharedKey}`
            },
            message: "Заметка расшарена",
            http_code: 200
        }
    }
}

const removeSharingNoteController = () => {
    return async (_, req) => {
        const note = req.note
        if (!note) {
            return {
                result: "system error",
                http_code: 500,
            }
        }

        if (!note.shared) {
            return {
                result: 'not shared',
                message: "Данной заметки среди расшаренных нет",
                http_code: 404
            }
        }

        note.sharedKey = null
        note.shared = false
        await note.save()

        return {
            result: 'success',
            message: "Заметка больше не расшарена",
            http_code: 200
        }
    }
}

const getSharedNoteController = (Model) => {
    return async (_, req) => {
        const {userId, token} = req.params
        const note = await Model.findOne({where: {userId, shared: true, sharedKey: token}})
        if (!note) {
            return {
                result: 'not found',
                message: "Неверный url",
                http_code: 404
            }
        }
        return {
            http_code: 200,
            result: note,
            message: "Успешно получена"
        }
    }
}

module.exports = (Model) => {
    return {
        getNote: getNoteController(Model),
        addNoteController: addNoteController(Model),
        getManyNotesController: getManyNotesController(Model),
        editNoteController: editNoteController(),
        deleteNoteController: deleteNoteController(Model),
        shareNoteController: shareNoteController(),
        removeSharingNoteController: removeSharingNoteController(),
        getSharedNote: getSharedNoteController(Model)
    }
}