const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const authController = require('../controllers/authentication.controller');

//Get all meals
router.get("/api/meal", mealController.getAllMeals);

//Post a meal
router.post("/api/meal", authController.validateToken, mealController.validateMeal, mealController.addMeal);

//Get meal by id
router.get("/api/meal/:mealId", mealController.getMealById);

//Update meal
router.put("/api/meal/:mealId", authController.validateToken, mealController.validateMealUpdate, authController.checkIfMealIsFromUser, mealController.updateMeal);

//Delete a meal
router.delete("/api/meal/:mealId", authController.validateToken, authController.checkIfMealIsFromUser, mealController.deleteMeal);

//Participate in meal
router.get("/api/meal/:mealId/participate");

module.exports = router