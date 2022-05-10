const express = require("express");
const userRouter = express.Router();
const userController = require('../controllers/user.controller');



//Get request on root
userRouter.get("/", (req, res) => {
    res.status(200).json({
        code: 200,
        message: "Hello this is the share a meal API from Mick Holster, Student number 2183861.",
    })

    res.end();
})


//Post user to database
userRouter.post("/api/user", userController.validateUserCreate, userController.addUser);

//Get user with ID
userRouter.get("/api/user/:userId", userController.getUserById);

//Update a user
userRouter.put("/api/user/:userId", userController.validateUserUpdate, userController.updateUser);

//Get all users
userRouter.get("/api/user", userController.getAllUsers);

//Delete user from database
userRouter.delete("/api/user/:userId", userController.deleteUser);

//Get user profile
userRouter.get("/api/user/profile", userController.profileUser);

module.exports = userRouter;