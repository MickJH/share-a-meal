const assert = require('assert');
const dbconnection = require('../../database/dbconnection');
const logger = require('../config/config').logger;

let userController = {


    validateUserCreate: (req, res, next) => {
        const { firstName, lastName, city, emailAdress, password, street } = req.body;

        try {
            assert(typeof firstName === 'string', 'First name must be a string.');
            assert(typeof lastName === 'string', 'Last name must be a string.');
            assert(typeof street === 'string', 'Street must be a string.');
            assert(typeof city === 'string', 'City must be a string.');
            assert(typeof emailAdress === 'string', 'Email address must be a string.');
            assert(typeof password === 'string', 'Password must be a string.');
            next();
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
        }
    },
    validateUserUpdate: (req, res, next) => {
        const { emailAdress } = req.body;
        try {

            assert(typeof emailAdress === 'string', 'Email address must be a string');

            next();
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
        }
    },
    //Add user to database
    addUser: (req, res, next) => {
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;

            let { emailAdress } = req.body;

            connection.query("SELECT COUNT(emailAdress) as count FROM user WHERE emailAdress = ?", emailAdress, (err, results, fields) => {
                if (err) throw err;

                if (results[0].count === 1) {
                    res.status(409).json({
                        status: 409,
                        message: "Email address already exists."
                    });
                } else {
                    //SQL QUERY
                    const { firstName, lastName, city, emailAdress, password, street } = req.body;
                    connection.query("INSERT INTO user (firstName, lastName, emailAdress, password, street, city) VALUES (?, ?, ?, ?, ? ,?)", [firstName, lastName, emailAdress, password, street, city], (err, results, fields) => {
                        if (err) throw err;

                        connection.query("SELECT * FROM user WHERE id = ?", results.insertId, (err, results, fields) => {
                            if (err) throw err;

                            connection.release();

                            if (results[0].isActive === 1) {
                                results[0].isActive = true;
                            } else {
                                results[0].isActive = false;
                            }

                            res.status(201).json({
                                status: 201,
                                result: results[0],
                                message: "User has succesfully been created",
                            });
                        })
                    });
                }
            });
        });

    },

    //Get all users from database
    getAllUsers: (req, res, next) => {
        logger.debug('getAll called')
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err // not connected!

            // Use the connection
            connection.query(
                'SELECT * FROM user;',
                function(error, results, fields) {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle error after the release.
                    if (error) throw error

                    // Don't use the connection here, it has been returned to the pool.
                    console.log('#results = ', results.length)
                    res.status(200).json({
                        status: 200,
                        results: results,
                    })
                }
            )
        })
    },
    //Get user by ID from database-
    getUserById: (req, res, next) => {

        dbconnection.getConnection((err, connection) => {
            if (err) throw err;


            const id = Number(req.params.userId);

            if (isNaN(id)) {
                return next();
            }

            //Use the connection
            connection.query('SELECT * FROM user WHERE id = ?', id, (err, results, fields) => {

                // When done with the connection, release it.
                connection.release()

                // Handle error after the release.
                if (err) throw err;

                if (results[0]) {
                    res.status(200).json({
                        status: 200,
                        result: results[0],
                    })
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `User with ${id} not found.`
                    })
                }

                res.end();
            })
        })



    },

    //Update user
    updateUser: (req, res, next) => {
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;

            const id = Number(req.params.userId);

            if (isNaN(id)) {
                return next();
            }

            const newUser = req.body;

            connection.query("SELECT * FROM user WHERE id = ?", id, (err, results, fields) => {
                if (err) throw err;

                const oldUser = results[0];

                if (oldUser) {

                    connection.query("SELECT COUNT(*) AS count FROM user WHERE emailAdress = ? AND id <> ?", [newUser.emailAdress, id], (err, results, fields) => {
                        if (err) throw err;

                        if (results[0].count === 1) {
                            return next({
                                status: 409,
                                message: "Email is already in use by another user"
                            })
                        } else {
                            const user = {
                                ...oldUser,
                                ...newUser
                            }

                            const { firstName, lastName, emailAdress, password, street, city } = user;

                            connection.query("UPDATE user SET firstName = ?, lastName = ?, emailAdress = ?, password = ?, street = ?, city = ? WHERE id = ?", [firstName, lastName, emailAdress, password, street, city, id], (err, results, fields) => {
                                if (err) throw err;

                                connection.release();

                                res.status(200).json({
                                    status: 200,
                                    result: user
                                });

                                res.end()
                            });
                        }
                    });
                } else {
                    return next({
                        status: 400,
                        message: "User does not exist"
                    })
                }

            })

        })

    },

    deleteUser: (req, res, next) => {
        logger.debug('deleteUser called')
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err // not connected!

            //localize userId in variable
            const id = Number(req.params.userId);

            //if userId isn't a number
            if (isNaN(id)) {
                return next();
            }

            // Use the connection
            connection.query(
                'DELETE FROM user WHERE id = ?', id, (err, results, fields) => {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle error after the release.
                    if (err) throw err;

                    // Don't use the connection here, it has been returned to the pool.
                    if (results.affectedRows === 1) {
                        console.log('#results = ', results.length)
                        res.status(200).json({
                            status: 200,
                            message: "User has been deleted succesfully",
                        })
                    } else {
                        res.status(400).json({
                            status: 400,
                            message: "User does not exist"
                        })
                    }

                }
            )
        })
    },

    //Get user profile
    profileUser: (req, res, next) => {
        res.status(200).json({
            status: 200,
            message: "User profiles are not implemented yet.",
        });

        res.end();
    },
}

module.exports = userController;