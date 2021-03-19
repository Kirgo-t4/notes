'use strict';

const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()

const {sequelize} = require('./core/models')
const apiRouter = require('./core/express/router')

const {User} = require('./core/models')
const {verifyToken} = require('./core/controllers/token')(User)

const app = express()
app.use(bodyParser.json())
app.use('/api/v1/', apiRouter)

app.use('*', verifyToken, (req, res, next) => {
    res.status(404).json({
        result: 'not found',
        message: "Неверный url",
        err: true
    })
})

app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).json({
        result: 'Error',
        message: 'неизвестная ошибка',
        err: false
    })
})

const port = process.env.PORT || 3000

const main = async () => {

    await sequelize.authenticate()

    console.log('Database connected')

    app.listen(port, () => {
        console.log(`Server started at port ${port}`)
    })
}

main().then()