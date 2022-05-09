const assert = require('assert');

let database = [];
let id = 0;

let userController = {


    validateUser: (req, res, next) => {
        let user = req.body;
        let { firstName, lastName, isActive, emailAddress, password, phoneNumber } = user;
        try {
            assert(typeof firstName === 'string', 'First name must be a string');
            assert(typeof lastName === 'string', 'Last name must be a string');
            assert(typeof isActive === 'boolean', 'Is active must be a boolean');
            assert(typeof emailAddress === 'string', 'Email address must be a string');
            next();
        } catch (err) {
            console.log(err);
            res.status(400).json({
                status: 400,
                result: err.toString(),
            })
        }
    },
    //Add user to database
    addUser: (req, res, next) => {
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
                message: "User email is already in use.",
            });
        }

        console.log(user);

        res.end();
    },

    //Get all users from database
    getAllUsers: (req, res, next) => {
        res.status(200).json({
            status: 200,
            result: database,
        });

        res.end();
    },

    //Get user by ID from database-
    getUserById: (req, res, next) => {
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

        res.end();
    },

    //Update user
    updateUser: (req, res, next) => {
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
            });

            if (acceptChangedEmail) {
                database[indexOfUser] = user;
                res.status(201).json({
                    status: 201,
                    message: "User has succesfully been updated.",
                    response: user,
                });
            } else {
                res.status(409).json({
                    status: 409,
                    message: `${user.emailAddress} is already in use by another user.`,
                });
            }
        } else {
            res.status(404).json({
                status: 404,
                message: `User with ${userId} not found.`,
            });
        }

        res.end();
    },

    deleteUser: (req, res, next) => {
        const userId = Number(req.params.userId);
        if (isNaN(userId)) {
            return next();
        }

        let user = database.filter((item) => item.id === userId);

        if (user.length > 0) {
            database = database.filter((item) => item.id !== userId);

            res.status(201).json({
                status: 201,
                message: "User removed succesfully.",
            });
        } else {
            res.status(404).json({
                status: 404,
                message: `User with ${userId} is not found.`,
            });
        }

        res.end();
    },

    profileUser: (req, res, next) => {
        res.status(200).json({
            status: 200,
            message: "User profiles are not implemented yet.",
        });

        res.end();
    },
}

module.exports = userController;