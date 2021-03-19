'use strict';

const router = require('express').Router()

const { body } = require('express-validator')
const apiHandler = require('./handlerTemplate')
const {checkValidation} = require('./common')
const {User, Note} = require('../models')

const {verifyToken} = require('../controllers/token')(User)

const {
    hashPasswordController,
    createUserController,
    getUserController,
    getJWTController,
    logoutController,
    deleteUserController
} = require('../controllers/user')(User)

const {
    getNote,
    addNoteController,
    getManyNotesController,
    editNoteController,
    deleteNoteController,
    shareNoteController,
    removeSharingNoteController,
    getSharedNote
} = require('../controllers/note')(Note)


router.post('/registry',
    body('login').notEmpty().withMessage('Логин не может быть пустым'),
    body('password').isLength({min: 5}).withMessage('Длина пароля не менее 5 символов'),
    apiHandler([
        checkValidation,
        hashPasswordController,
        createUserController
]))

router.post('/login',
    body('login').notEmpty().withMessage('Введите логин'),
    body('password').notEmpty().withMessage('Введите пароль'),
    apiHandler([
        checkValidation,
        getUserController,
        getJWTController
]))


router.post('/logout', verifyToken, apiHandler([
    logoutController
]))

router.delete('/user', verifyToken, apiHandler([
    deleteUserController
]))

router.post('/note',
    verifyToken,
    body('text').notEmpty().withMessage('Заметка полностью пустая'),
    apiHandler([
        checkValidation,
        addNoteController
]))



router.get('/note/:id', verifyToken, apiHandler([
    getNote,
    async (_, req) => {
        return {
            http_code: 200,
            result: req.note,
            message: "Успешно получена"
        }
    }
]))

router.get('/note', verifyToken, apiHandler([
    getManyNotesController
]))

router.put('/note/:id',
    verifyToken,
    body('text').notEmpty().withMessage('Заметка полностью пустая'),
    apiHandler([
        checkValidation,
        getNote,
        editNoteController
    ])
)

router.delete('/note/:id',
    verifyToken,
    apiHandler([
        getNote,
        deleteNoteController
    ])
)

router.post('/note/:id/share',
    verifyToken,
    apiHandler([
        getNote,
        shareNoteController
    ])
)

router.delete('/note/:id/share',
    verifyToken,
    apiHandler([
        getNote,
        removeSharingNoteController
    ])
)

router.get('/note/:userId/share/:token', apiHandler([
    getSharedNote
]))


module.exports = router