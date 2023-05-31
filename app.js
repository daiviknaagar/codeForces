const express = require("express")
const app = express()
const path = require('path')
const contestList = require('./controllers/calls')

app.use(express.static(path.join(__dirname, "static")))

app.use(express.json())

//routes
const route = require('./routes/route')

app.use('/api/v1', route)

module.exports = app