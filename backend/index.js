const db = require('./models')
const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')

const port = process.env.PORT || "3000"

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(port, () => {
    console.log(`Server started.  Listening on port ${port}`)
})

app.get("/", (req, res) => {
    res.json({message: "Welcome to the TikTak REST API"})
})

require("./routes")(app);