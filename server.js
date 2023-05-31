const dotenv = require("dotenv")
const connectDB = require("./config/database")
// const { json } = require('body-parser')
const express = require("express")
const app = express()
const path = require('path')
const User = require('./models/userModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const session = require('express-session')
const axios = require('axios')

app.set('view engine', 'ejs')
app.set('views', 'views')
app.set('views', path.join(__dirname, '/views'))

app.use(express.static(__dirname + '/static'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: 'notagoodsecret' }))

const url = 'https://codeforces.com/api/'

//config
dotenv.config({ path: "config/config.env" })

//connecting to database
connectDB()

//sabse khulla
app.get('/', (req, res) => {
    res.render('open')
})

//authentication ka
const returnLogin = (req, res, next) => {
    if (req.session.user_id) {
        return next()
    }
    res.redirect('/login')
}

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', async (req, res) => {
    const { username, codeforces, password } = req.body
    const hash = await bcrypt.hash(password, 10)
    const user = new User({
        username,
        codeforces,
        password: hash,
        track: [],
        lastUserChecked: username
    })
    await user.save()
    res.redirect('/login')
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user) {
        const valid = await bcrypt.compare(password, user.password)
        if (valid) {
            req.session.user_id = user._id
            res.redirect("/home")
        }
        else {
            res.redirect('/login')
        }
    }
    else {
        res.redirect('/login')
    }
})

app.post('/logout', async (req, res) => {
    await req.session.destroy()
    await res.redirect('/login')
})

//andar ka
app.get('/home', returnLogin, async (req, res) => {
    const _id = await req.session.user_id
    const u = await User.findOne({ _id })
    for (var j = 0; j < u.track.length; j++) {
        const r = await fetch(url + `user.info?handles=${u.track[j].codeforces}`)
        const i = await r.json()
        u.track[j].rating = i.result[0].rating
        u.track[j].maxRating = i.result[0].maxRating
        u.track[j].img = i.result[0].avatar
    }
    u.save()

    res.render('home.ejs', { u })

})

app.get('/contests', async (req, res) => {
    let response = await fetch(url + 'contest.list')
    let contests = await response.json()

    var p = []
    var q = []
    var i = 0;
    while (contests.result[i].phase == "BEFORE") {
        p.push(contests.result[i])
        i++;
    }
    // console.log(p)

    res.render('contestList.ejs', { p })
})

app.get('/userInfo', returnLogin, async (req, res) => {
    try {
        if (req.query.handles) {
            const header = { headers: { Accept: 'application/json' } }
            let info = await axios.get(url + `user.info?handles=${req.query.handles}`, header)
            let r = await axios.get(url + `user.rating?handle=${req.query.handles}`, header)
            let change = await r.data
            let p = await info.data.result
            const _id = req.session.user_id
            const user = await User.findOne({ _id })
            user.lastUserChecked = await req.query.handles
            await user.save()
            // await console.log(p)
            let k = await change.result[change.result.length - 1].newRating - change.result[change.result.length - 1].oldRating
            // console.log(change.result)
            res.render('userInfo.ejs', { p, k })
        }
    }
    catch (e) {
        console.log(e)
    }
})

//tracking ka
app.post('/userInfo', returnLogin, async (req, res) => {
    const _id = req.session.user_id
    const header = { headers: { Accept: 'application/json' } }
    const user = await User.findOne({ _id })
    let info = await axios.get(url + `user.info?handles=${user.lastUserChecked}`, header)
    let r = await axios.get(url + `user.rating?handle=${user.lastUserChecked}`, header)
    let change = r.data
    let p = await info.data.result
    let k = await change.result[change.result.length - 1].newRating - change.result[change.result.length - 1].oldRating
    const t = await {
        codeforces: p[0].handle,
        rating: p[0].rating,
        maxRating: p[0].maxRating,
        img: p[0].avatar,
        diff: k
    }
    await user.track.push(t)
    await user.save()

    // console.log(t)
    res.redirect('/home')
})

app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`)
})