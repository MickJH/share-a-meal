//
// Authentication controller
//
const assert = require('assert')
const jwt = require('jsonwebtoken')
const dbconnection = require('../../database/dbconnection')
    // const validateEmail = require('../util/emailvalidator')
const logger = require('../config/config').logger
const jwtSecretKey = require('../config/config').jwtSecretKey

module.exports = {
    login(req, res, next) {
        dbconnection.getConnection((err, connection) => {
            if (err) {
                logger.error('Error getting connection from dbconnection')
                res.status(500).json({
                    error: err.toString(),
                    datetime: new Date().toISOString(),
                })
            }
            if (connection) {
                // 1. Check if user exists.
                connection.query(
                    'SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?', [req.body.emailAdress],
                    (err, rows, fields) => {
                        connection.release()
                        if (err) {
                            logger.error('Error: ', err.toString())
                            res.status(500).json({
                                error: err.toString(),
                                datetime: new Date().toISOString(),
                            })
                        }
                        if (rows) {
                            // 2. There was a result, check password.
                            if (
                                rows &&
                                rows.length === 1 &&
                                rows[0].password == req.body.password
                            ) {
                                logger.info(
                                        'passwords DID match, sending userinfo and valid token'
                                    )
                                    // Extract the password from the userdata - we do not send that in the response.
                                const { password, ...userinfo } = rows[0]
                                    // Create an object containing the data we want in the payload.
                                const payload = {
                                    userId: userinfo.id,
                                }

                                jwt.sign(
                                    payload,
                                    jwtSecretKey, { expiresIn: '12d' },
                                    function(err, token) {
                                        logger.debug(
                                            'User logged in, sending: ',
                                            userinfo
                                        )
                                        res.status(200).json({
                                            statusCode: 200,
                                            results: {...userinfo, token },
                                        })
                                    }
                                )
                            } else {
                                logger.info(
                                    'User not found or password invalid'
                                )
                                res.status(401).json({
                                    message: 'User not found or password invalid',
                                    datetime: new Date().toISOString(),
                                })
                            }
                        }
                    }
                )
            }
        })
    },

    //
    //
    //
    validateLogin(req, res, next) {
        // Verify that we receive the expected input
        try {
            assert(
                typeof req.body.emailAdress === 'string',
                'email must be a string.'
            )
            assert(
                typeof req.body.password === 'string',
                'password must be a string.'
            )
            next()
        } catch (ex) {
            res.status(422).json({
                error: ex.toString(),
                datetime: new Date().toISOString(),
            })
        }
    },

    //
    //
    //
    validateToken(req, res, next) {
        logger.info('validateToken called')
            // The headers should contain the authorization-field with value 'Bearer [token]'
        const authHeader = req.headers.authorization
        if (!authHeader) {
            logger.warn('Authorization header missing!')
            res.status(401).json({
                error: 'Authorization header missing!',
                datetime: new Date().toISOString(),
            })
        } else {
            // Strip the word 'Bearer ' from the headervalue
            const token = authHeader.substring(7, authHeader.length)

            jwt.verify(token, jwtSecretKey, (err, payload) => {
                if (err) {
                    logger.warn('Not authorized')
                    res.status(401).json({
                        error: 'Not authorized',
                        datetime: new Date().toISOString(),
                    })
                }
                if (payload) {
                    logger.debug('token is valid', payload)
                    req.userId = payload.userId
                    next()
                }
            })
        }
    },

    checkIfMealIsFromUser: (req, res, next) => {
        dbconnection.getConnection(function(err, connection) {
            if (err) next(err);

            const id = req.params.id;

            connection.query('SELECT * FROM meal WHERE id = ?', id, (error, results, fields) => {
                //Release connection with database
                connection.release();

                if (err) next(err);

                if (results[0]) {
                    const cookId = results[0].cookid;
                    const jsonToken = authHeader.substring(7, authHeader.length);
                    let idFromUser;

                    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                        if (err) next(err);
                        idFromUser = decoded.cookId;
                    })

                    if (idFromUser === cookId) {
                        next();
                    } else {
                        res.status(401).json({
                            status: 401,
                            message: "You are not the cook of this meal"
                        })
                    }
                } else {
                    res.status(401).json({
                        status: 401,
                        message: "Meal not found"
                    })
                }
            })
        })
    }
}