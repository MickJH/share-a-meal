const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

let database = [];
let id = 0;

app.all("*", (req, res, next) => {
    const method = req.method;
    console.log(`Method ${method} is aangeroepen`);
    next();
});

app.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        result: "Hello World",
    });
});

app.post("/api/user", (req, res) => {
    let user = req.body;
    id++;
    user = {
        id,
        ...user,
    };
    console.log(user);
    database.push(user);
    res.status(201).json({
        status: 201,
        result: database,
    });
});

app.get("/api/user/:userId", (req, res, next) => {
    const userId = req.params.mealId;
    console.log(`User with ID ${userId} found`);
    let user = database.filter((item) => item.id == userId);
    if (user.length > 0) {
        console.log(user);
        res.status(200).json({
            status: 200,
            result: user,
        });
    } else {
        res.status(401).json({
            status: 401,
            result: `User with ID ${movieId} not found`,
        });
    }
});

app.get("/api/user", (req, res, next) => {
    res.status(200).json({
        status: 200,
        result: database,
    });
});

app.delete("/api/user/:id", (req, res) => {
    const userId = Number(req.params.id)

    let user = database.filter((item) => item.id === userId)

    if (user.length > 0) {
        database = database.filter((item) => item.id !== userId)

        res.status(201).json({
            status: 201,
            message: "User removed succesfully."
        })
    } else {
        res.status(404).json({
            status: 404,
            message: `User with ${userId} is not found.`
        })
    }

    res.end()
})

app.all("*", (req, res) => {
    res.status(401).json({
        status: 401,
        result: "End-point not found",
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});