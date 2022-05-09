const express = require("express");
const userRouter = express.Router();
const userController = require('../controllers/user.controller');



//Get request on root
userRouter.get("/", (req, res) => {
    res.status(200).json({
        code: 200,
        message: "Hello this is the share a meal API from Mick Holster.",
    })

    res.end();
})


//Post user to databasea
userRouter.post("/api/user", userController.validateUser, userController.addUser);

//Get user with ID
userRouter.get("/api/user/:userId", userController.getUserById);

//Update a user
userRouter.put("/api/user/:userId", userController.updateUser);

//Get all users
userRouter.get("/api/user", userController.getAllUsers);

//Delete user from database
userRouter.delete("/api/user/:userId", userController.deleteUser);

//Get user profile
userRouter.get("/api/user/profile", userController.profileUser);

module.exports = userRouter;