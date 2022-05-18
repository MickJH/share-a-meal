process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
process.env.LOGLEVEL = 'warn'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../../index')
const assert = require('assert')
require('dotenv').config()
const dbconnection = require('../../src/database/dbconnection')
const jwt = require('jsonwebtoken')
const { jwtSecretKey, logger } = require('../../src/config/config')

chai.should()
chai.use(chaiHttp)

/**
 * Db queries to clear and fill the test database before each test.
 */
const CLEAR_MEAL_TABLE = 'DELETE IGNORE FROM `meal`;'
const CLEAR_PARTICIPANTS_TABLE = 'DELETE IGNORE FROM `meal_participants_user`;'
const CLEAR_USERS_TABLE = 'DELETE IGNORE FROM `user`;'
const CLEAR_DB = CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE

/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
const INSERT_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(1, "first", "last", "name@server.nl", "secret", "street", "city");'

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);"


let deletableUserId;

// UC-201 Register as new user
describe("UC-201 Register as new user - POST /api/user", () => {
    it("TC-201-1 Required input is missing", (done) => {
        chai.request(server)
            .post("/api/user")
            .send({
                firstName: "Mick",
                lastName: "Holster",
                street: "Teststreet 13",
                //City missing
                isActive: true,
                emailAddress: "mj.holster@student.avans.nl",
                password: "TestPassword",
                phoneNumber: "06 123456789",
            })
            .end((req, res) => {
                res.should.be.an("object");
                let { status, message } = res.body;
                status.should.equals(400);
                console.log(res.body)
                message.should.be.a("string").that.equals("City must be a string.");
                done();
            });
    });

    it("TC-201-4 User already exists", (done) => {
        chai.request(server)
            .post("/api/user")
            .send({
                firstName: "Piet",
                lastName: "Jan",
                isActive: true,
                emailAdress: "h.tank@server.com", //email that exists in database
                password: "PietJan123",
                phoneNumber: "0612345678",
                roles: "editor,guest",
                street: "Pijl",
                city: "Dordrecht",
            })
            .end((req, res) => {
                res.should.be.an("object");
                let { status } = res.body;
                status.should.equals(409);
                done();
            });
    });
    it("TC-201-5 User has been registered succesfully", (done) => {
        chai.request(server)
            .post("/api/user")
            .send({
                firstName: "Peter",
                lastName: "Pannenkoek",
                isActive: true,
                emailAdress: `peterpannekoek@gmail.com`,
                password: "PeterPannekoek",
                phoneNumber: "0612345678",
                roles: "editor,guest",
                street: "Phoenixring",
                city: "Dordrecht",
            })
            .end((req, res) => {
                res.should.be.an("object");
                let {
                    status,
                    result
                } = res.body;

                deletableUserId = result.id;

                status.should.equals(201);
                done();
            });
    });
});

// UC-204 Get user details
describe("UC-204 Get user details - GET /api/user/:id", () => {

    it("TC-204-2 User ID doesn't exist", (done) => {
        chai.request(server)
            .get("/api/user/0")
            .end((req, res) => {
                let { status } = res.body;
                status.should.equals(404);
                done();
            });
    });
    it("TC-204-3 User ID exists", (done) => {
        chai.request(server)
            .get("/api/user/" + deletableUserId)
            .end((req, res) => {
                let { status } = res.body;
                status.should.equals(200);
                done();
            });
    });
});

// UC-205 Modify user
describe("UC-205 Modify user - PUT /api/user/:id", () => {
    it("TC-205-1 Required field missing", (done) => {
        chai.request(server)
            .put("/api/user/1")
            .send({
                firstName: "Linda",
                lastName: "Bloemen",
                isActive: true,
                //missing email
                password: "1234567",
                phoneNumber: "0612345678",
                roles: "editor,guest",
                street: "Jan willemstraat",
                city: "Brielle",
            })
            .end((req, res) => {
                let { status, message } = res.body;
                status.should.equals(400);
                message.should.be.an("string").that.equals("Email address must be a string");
                done();
            });
    });

    it("TC-205-4 User doesn't exists", (done) => {
        chai.request(server)
            .put("/api/user/0")
            .send({
                firstName: "Jens",
                lastName: "van Luidschendam",
                isActive: true,
                emailAdress: `test@student.avans.nl`,
                password: "dmG!F]!!6cUwK7JQ",
                phoneNumber: "0612345678",
                roles: "editor,guest",
                street: "Balkenendeweg",
                city: "Amsterdam",
            })
            .end((req, res) => {
                let { status } = res.body;
                status.should.equals(400);
                done();
            });
    });

    it("TC-205-6 User has been modified successfully", (done) => {
        chai.request(server)
            .put("/api/user/" + deletableUserId)
            .send({
                firstName: "Klaas",
                lastName: "Jan",
                isActive: true,
                emailAdress: `klaasjan@gmail.com`,
                password: "Klaasje123",
                phoneNumber: "0612345678",
                roles: "editor,guest",
                street: "Vierkant",
                city: "Rockanje",
            })
            .end((req, res) => {
                let { status } = res.body;
                status.should.equals(200);
                done();
            });
    });
});

// UC-206 Delete user
describe("UC-206 Delete user - DELETE /api/user/:id", () => {
    it("TC-206-1 User doesn't exist", (done) => {
        chai.request(server)
            .delete("/api/user/0")
            .end((req, res) => {
                let { status } = res.body;
                status.should.equals(400);
                done();
            });
    });

    it("TC-206-4 User has been deleted successfully", (done) => {
        chai.request(server)
            .delete("/api/user/" + deletableUserId)
            .end((req, res) => {
                let { status } = res.body;

                status.should.equals(200);
                res.body.should.have.property("message");

                done();
            });
    });
});