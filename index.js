const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT;
const userRouter = require("./src/routes/user.routes");
const authRouter = require("./src/routes/authentication.routes");
const mealRouter = require("./src/routes/meal.routes");
const logger = require('./src/config/config').logger


app.use(express.json());


//Check to see with method is called 
app.all("*", (req, res, next) => {
    const method = req.method;
    logger.debug(`Method ${method} is aangeroepen`);
    next();
});

app.use(userRouter);
app.use(authRouter);
app.use(mealRouter);

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
    logger.debug(`App is listening on port ${port}`);
});

module.exports = app;