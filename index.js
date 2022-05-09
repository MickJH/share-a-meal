const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
const router = require('./src/routes/user.routes');
const userRouter = require("./src/routes/user.routes");


app.use(bodyParser.json());


//Check to see with method is called 
app.all("*", (req, res, next) => {
    const method = req.method;
    console.log(`Method ${method} is aangeroepen`);
    next();
});

app.use(userRouter);

//If request is not found
app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        result: "End-point not found",
    });

    res.end();
});

//Error handler
app.use((err, req, res, next) => {
    res.status(err.status).json(err);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});