const assert = require('assert');
const jwt = require('jsonwebtoken');
const dbconnection = require('../../database/dbconnection');
const logger = require('../config/config').logger;

let mealController = {


    validateMeal: (req, res, next) => {
        const { name, description, isActive, isVega, isVegan, isToTakeHome, dateTime, imageUrl, allergenes, maxAmountOfParticipants, price } = req.body;

        try {
            assert(typeof name === 'string', 'Meal name must be a string.');
            assert(typeof description === 'string', 'Description must be a string.');
            assert(typeof isActive === 'string', 'Is active must be a string.');
            assert(typeof isVega === 'string', 'City must be a string.');
            assert(typeof isVegan === 'string', 'Is vegan must be a string.');
            assert(typeof isToTakeHome === 'boolean', 'Is to take home must be a string.');
            assert(typeof dateTime === 'string', 'Date must be a string.');
            assert(typeof imageUrl === 'string', 'Image URL must be a string.');
            assert(typeof maxAmountOfParticipants === 'string', 'Participants must be a string.');
            assert(typeof price === 'string', 'Price must be a string.');
            next();
        } catch (err) {
            next({
                status: 400,
                message: err.message,
            });
        }
    },

    validateMealUpdate: (req, res, next) => {
        let { name, price, maxAmountOfParticipants } = req.body;

        if (name || price || maxAmountOfParticipants) {
            try {
                if (name) {
                    assert(typeof name === 'string', 'Meal name must be a string');
                }
                if (price) {
                    assert(typeof price === 'string', 'Price must be a string');
                }
                if (maxAmountOfParticipants) {
                    assert(typeof maxAmountOfParticipants === 'string', 'Participants must be a string');
                }
                next();
            } catch (err) {
                res.status(400).json({
                    status: 400,
                    message: err.message,
                });
            }
        } else {
            res.status(400).json({
                status: 400,
                message: 'Required field is missing',
            })
        }
    },

    //Add meal to database
    addMeal: (req, res, next) => {
        logger.debug("addMeal called")
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err;

            const meal = req.body;
            const allergenes = req.body.allergenes;
            let arrayAllergenes = [];
            let stringAllergenes = "";


            if (allergenes) {
                allergenes.forEach(element => {
                    if (element === "gluten" || element === "noten" || element == "lactose") {
                        if (!(arrayAllergenes.includes(element))) {
                            arrayAllergenes.push(element);
                            stringAllergenes += element + ",";
                        }
                    }
                });
                stringAllergenes = stringAllergenes.slice(0, -1);
            }


            //Verify token
            const authHeader = req.headers.authorization;
            const token = authHeader.substring(7, authHeader.length);
            let cookId;

            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                cookId = decoded.userId;
            });


            const addMeal = [meal.name, meal.description, meal.isActive, meal.isVega, meal.isVegan, meal.isToTakeHome, meal.dateTime, meal.imageUrl, stringAllergenes, cookId, meal.maxAmountOfParticipants, meal.price];

            //SQL Queries
            connection.query('INSERT INTO meal (name, description, isActive, isVegan, isToTakeHome, dateTime, imageUrl, allergenes, maxAmountOfParticipants, price) VALUES (?,?,?,?,?,?,?,?,?,?)', addMeal, (err, results, fields) => {
                connection.release();
                if (err) throw err;

                const mealId = results.insertId;

                connection.query('SELECT * FROM user WHERE id = ?', cookId, (err, results, fields) => {
                    connection.release();
                    if (err) throw err;

                    const cook = results[0];

                    connection.query('INSERT INTO meal_participants_user (mealId, userId) VALUES (?,?)', [mealId, cookId], (err, results, fields) => {
                        connection.release();
                        if (err) throw err;

                        connection.query('SELECT * FROM meal_participants_user WHERE mealId = ?', mealId, (err, results, fields) => {
                            connection.release();
                            if (err) throw err;

                            let arrayParticipantId = [];

                            results.forEach(element => {
                                arrayParticipantId.push(element.userId);
                            });

                            let arrayParticipants = [];
                            arrayParticipantId.forEach(element => {
                                connection.query('SELECT * FROM user WHERE id = ?', element, (err, results, fields) => {
                                    connection.release();
                                    if (err) throw err;

                                    arrayParticipants.push(results[0]);

                                    mealResult = {
                                        "id": mealId,
                                        ...meal,
                                        "cook": cook,
                                        "participants": arrayParticipants
                                    };

                                    logger.info(mealResult)

                                    res.status(201).json({
                                        status: 201,
                                        result: mealResult,
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    },

    //Get all meals from database
    getAllMeals: (req, res, next) => {
        logger.debug('getAll called')
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err // not connected!

            // Use the connection
            connection.query(
                'SELECT * FROM meal;',
                function(err, results, fields) {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle err after the release.
                    if (err) throw err

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
    //Get meal by ID from database-
    getMealById: (req, res, next) => {
        logger.debug("getMealById called")
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;
            const id = Number(req.params.mealId);

            if (isNaN(id)) {
                return next();
            }

            //Use the connection
            connection.query('SELECT * FROM meal WHERE id = ?', id, (err, results, fields) => {

                // When done with the connection, release it.
                connection.release()

                // Handle err after the release.
                if (err) throw err;

                if (results[0]) {
                    res.status(200).json({
                        status: 200,
                        result: results[0],
                    })
                } else {
                    res.status(404).json({
                        status: 404,
                        message: `Meal with ${id} not found.`
                    })
                }

                res.end();
            })
        })



    },

    //Update meal
    updateMeal: (req, res, next) => {
        logger.debug("updateMeal called")
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;

            const meal = req.body;
            const id = Number(req.params.userId);

            if (isNaN(id)) {
                return next();
            }

            //SQL Query
            connection.query('SELECT * FROM meal WHERE id = ?', id, (err, results, fields) => {
                connection.release();

                if (err) throw err

                let updatedMeal = {
                    ...results[0],
                    ...meal,
                }

                const updateMeal = [meal.name, meal.description, meal.isActive, meal.isVega, meal.isVegan, meal.isToTakeHome, meal.dateTime, meal.imageUrl, meal.maxAmountOfParticipants, meal.price, id];

                connection.query('UPDATE meal SET name = ?, description = ?, isActive = ?, isVega = ?, isVegan = ?, isToTakeHome = ?, dateTime = ?, imageUrl = ?, maxAmountOfParticipants = ?, price = ? WHERE id = ?', updateMeal, (err, results, fields) => {
                    {
                        connection.release();
                        if (err) throw err

                        res.status(200).json({
                            status: 200,
                            result: updatedMeal,
                        })
                    }
                })
            })

        })

    },

    deleteMeal: (req, res, next) => {
        logger.debug('deleteMeal called')
        dbconnection.getConnection(function(err, connection) {
            if (err) throw err // not connected!

            //localize userId in variable
            const id = Number(req.params.userId);

            //if mealId isn't a number
            if (isNaN(id)) {
                return next();
            }

            // Use the connection
            connection.query(
                'DELETE FROM meal WHERE id = ?', id, (err, results, fields) => {
                    // When done with the connection, release it.
                    connection.release()

                    // Handle err after the release.
                    if (err) throw err;

                    // Don't use the connection here, it has been returned to the pool.
                    if (results.affectedRows === 1) {
                        console.log('#results = ', results.length)
                        res.status(200).json({
                            status: 200,
                            message: "Meal has been deleted succesfully",
                        })
                    } else {
                        res.status(400).json({
                            status: 400,
                            message: "Meal does not exist"
                        })
                    }

                }
            )
        })
    },


}

module.exports = mealController;