'use strict';

const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()

const {sequelize} = require('./core/models')


const app = express()
app.use(bodyParser.json())

const port = process.env.PORT || 3000

const main = async () => {

    await sequelize.authenticate()

    console.log('Database connected')

    app.listen(port, () => {
        console.log(`Server started at port ${port}`)
    })
}

main().then()