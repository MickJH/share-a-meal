const assert = require('assert');
const dbconnection = require('../../database/dbconnection');
const jwt = require('jsonwebtoken')
const { jwtSecretKey } = require('../config/config');
const logger = require('../config/config').logger;
var Regex = require('regex');

let userController = {

    //Validations
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

            assert(typeof emailAdress === 'string', 'Email address not valid');

            next();
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
        }
    },

    validateEmail: (req, res, next) => {
        var regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        const email = req.body.emailAdress;
        if (regex.test(email)) {
            next();
        } else {
            res.status(400).json({
                status: 400,
                message: "Email address not valid"
            })
        }
    },


    validatePassword: (req, res, next) => {
        const regex = /^.{6,}$/;
        const password = req.body.password;
        if (regex.test(password)) {
            next();
        } else {
            res.status(400).json({
                status: 400,
                message: "Password too weak"
            })
        }
    },

    validatePhoneNumber: (req, res, next) => {
        var regex = /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/;
        const phoneNumber = req.body.phoneNumber;
        if (phoneNumber) {
            if (regex.test(phoneNumber)) {
                next();
            } else {
                res.status(400).json({
                    status: 400,
                    message: "Phone number not valid"
                })
            }
        } else {
            next();
        }
    },


    //Add user to database
    addUser: (req, res, next) => {
        logger.debug("addUser called")
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

            let { isActive, firstName, limit, lastName, emailAdress, street, city, phoneNumber } = req.query;

            let queryString = "SELECT * FROM user";

            if (isActive || firstName || limit || lastName || emailAdress || street || city || phoneNumber) {
                let count = 0;

                if (isActive || firstName || lastName || emailAdress || street || city || phoneNumber) {
                    queryString += " WHERE ";
                }

                if (isActive) {
                    queryString += `isActive = ${isActive}`;
                    count++;
                }

                if (firstName) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `firstName = '${firstName}'`;
                }

                if (lastName) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `lastName = '${lastName}'`;
                }

                if (emailAdress) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `emailAdress = '${emailAdress}'`;
                }

                if (street) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `street = '${street}'`;
                }

                if (city) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `city = '${city}'`;
                }

                if (phoneNumber) {
                    if (count === 1) {
                        queryString += " AND ";
                    }
                    count++;
                    queryString += `phoneNumber = '${phoneNumber}'`;
                }

                if (limit) {
                    count++;

                    queryString += ` LIMIT ${limit}`;
                }

                if (count > 2) {
                    return next({
                        status: 400,
                        message: "Maximum amount of parameters (2) has been surpassed.",
                    });
                }
            }
            // Use the connection
            connection.query(
                queryString,
                function(error, results, fields) {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle error after the release.
                    if (error) throw error

                    // Don't use the connection here, it has been returned to the pool.
                    console.log('#results = ', results.length)
                    res.status(200).json({
                        status: 200,
                        result: results,
                    })
                }
            )
        })
    },
    //Get user by ID from database-
    getUserById: (req, res, next) => {
        logger.debug("getUserById called")
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
        logger.debug("updateUser called")
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
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;

            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7, authHeader.length);
            let id;

            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                id = decoded.userId;
            })

            connection.query('SELECT * FROM user WHERE id = ?', id, (err, results, fields) => {
                connection.release();
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    result: results[0]
                })
            })
        })
    },
}

module.exports = userController;