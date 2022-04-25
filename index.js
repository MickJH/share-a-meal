const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

let database = [];
let id = 0;

//Check to see with method is called 
app.all("*", (req, res, next) => {
    const method = req.method;
    console.log(`Method ${method} is aangeroepen`);
    next();
});

//Post user to databasea
app.post("/api/user", (req, res) => {
    let addUser = true;
    let user = req.body;

    database.forEach((element) => {
        if (element.emailAddress === user.emailAddress) {
            addUser = false;
        }
    });

    if (addUser) {
        id++;
        user = {
            id,
            ...user,
        };

        database.push(user);
        res.status(201).json({
            status: 201,
            result: database,
        });
    } else {
        res.status(409).json({
            status: 409,
            message: "User email is already in use."
        });
    }

    console.log(user);

});

//Get user with ID
app.get("/api/user/:userId", (req, res, next) => {
    const userId = req.params.userId;
    if (isNaN(userId)) {
        return next();
    }
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
            result: `User with ID ${userId} not found`,
        });
    }
});

//Update a user
app.put("/api/user/:userId", (req, res, next) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        return next();
    }
    let user = req.body;
    user = {
        id,
        ...user,
    };

    let usersInDatabase = database.filter((item) => item.id === userId);

    if (usersInDatabase.length > 0) {
        indexOfUser = database.findIndex((userObj) => userObj.id === userId);
        let acceptChangedEmail = true;
        const otherUsers = database.filter((item) => item.id !== userId);

        otherUsers.forEach((element) => {
            if (element.emailAddress === user.emailAddress) {
                acceptChangedEmail = false;
            }
        })

        if (acceptChangedEmail) {
            database[indexOfUser] = user;
            res.status(201).json({
                status: 201,
                message: "User has succesfully been updated.",
                response: user,
            })
        } else {
            res.status(409).json({
                status: 409,
                message: `${user.emailAddress} is already in use by another user.`,
            })
        }
    } else {
        res.status(404).json({
            status: 404,
            message: `User with ${userId} not found.`
        })
    }

    res.end();
});

//Get all users
app.get("/api/user", (req, res, next) => {
    res.status(200).json({
        status: 200,
        result: database,
    });
});

//Delete user from database
app.delete("/api/user/:userId", (req, res, next) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) {
        return next();
    }

    let user = database.filter((item) => item.id === userId);

    if (user.length > 0) {
        database = database.filter((item) => item.id !== userId);

        res.status(201).json({
            status: 201,
            message: "User removed succesfully."
        });
    } else {
        res.status(404).json({
            status: 404,
            message: `User with ${userId} is not found.`
        });
    }

    res.end();
});

//Get user profile
app.get("/api/user/profile", (req, res) => {
    res.status(200).json({
        status: 200,
        message: "User profiles are not implemented yet."
    })
})

//If request is not found
app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        result: "End-point not found",
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});