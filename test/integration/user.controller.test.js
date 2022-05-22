// process.env.DB_DATABASE = process.env.DB_DATABASE || 'share-a-meal-testdb'
process.env.LOGLEVEL = 'warn'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../../index')
const assert = require('assert')
const { expect } = require('chai');
require('dotenv').config()
const dbconnection = require('../../database/dbconnection')
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
const INSERT_SECOND_USER =
    'INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES' +
    '(2, "first", "last", "name@test.nl", "secret", "street", "city");'

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
    'INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES' +
    "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
    "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);"

describe('UC-2 Manage users /api/user', () => {
    beforeEach((done) => {
        dbconnection.getConnection((err, connection) => {
            if (err) throw err;

            connection.query(CLEAR_DB + INSERT_USER + INSERT_SECOND_USER, (err, results, fields) => {
                if (err) throw err;
                connection.release();
                done();
            });
        });
    });



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
                    emailAdress: "mj.holster@student.avans.nl",
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

        // it("TC-201-2 Invalid email address", (done) => {
        //     chai.request(server)
        //         .post('/api/user')
        //         .send({
        //             firstName: "Mick",
        //             lastName: "Holster",
        //             street: "Test street",
        //             city: "Dordrecht",
        //             //Invalid email address
        //             emailAdress: "123454.com",
        //             password: "secret",
        //         })
        //         .end((req, res) => {
        //             res.should.have.status(400);
        //             res.should.be.an('object');

        //             res.body.should.be.an('object').that.has.all.keys('status', 'message');

        //             let { status, message } = res.body;
        //             status.should.be.a('number').that.equals(400);
        //             message.should.be.a('string').that.equals('Email address not valid');

        //         })
        // })

        // it("TC-201-3 Invalid password", (done) => {
        //     chai.request(server)
        //         .post('/api/user')
        //         .send({
        //             firstName: "Mick",
        //             lastName: "Holster",
        //             street: "Test street",
        //             city: "Dordrecht",
        //             emailAdress: "mj.holster@student.avans.nl",
        //             //Invalid password
        //             password: "four",
        //         })
        //         .end((req, res) => {
        //             res.should.have.status(400);
        //             res.should.be.an('object');

        //             res.body.should.be.an('object').that.has.all.keys('status', 'message');

        //             let { status, message } = res.body;
        //             status.should.be.a('number').that.equals(400);
        //             message.should.be.a('string').that.equals('Password too weak');

        //         })
        // })

        it("TC-201-4 User already exists", (done) => {
            chai.request(server)
                .post("/api/user")
                .send({
                    firstName: "Piet",
                    lastName: "Jan",
                    isActive: true,
                    emailAdress: "name@test.nl", //email that exists in database
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

    //UC 202 User overview
    describe("UC-202 Overview Users - GET /api/user", () => {

        it('TC-202-1 Show zero users', (done) => {
            chai.request(server)
                .get('/api/user?firstName=thisuserdoesntexist')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    result.should.be.an('array').that.has.a.lengthOf(0);
                    done()
                })
        })

        it('TC-202-2 Show users', (done) => {
            chai.request(server)
                .get('/api/user?firstName=first')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    expect(status).to.equal(200)
                    expect(result[0].id).to.equal(1)
                    expect(result[0].firstName).to.equal('first');
                    expect(result[0].lastName).to.equal('last');
                    expect(result[0].isActive).to.equal(1);
                    expect(result[0].emailAdress).to.equal('name@server.nl');
                    expect(result[0].password).to.equal('secret');
                    expect(result[0].phoneNumber).to.equal('-');
                    expect(result[0].street).to.equal('street');
                    expect(result[0].city).to.equal('city');
                    done()
                })
        })


        it('TC-202-3 Non existing name', (done) => {
            chai.request(server)
                .get('/api/user?firstName=thisuserdoesntexist')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    result.should.be.an('array').that.has.a.lengthOf(0);
                    done()
                })
        })

        it('TC-202-4 Show users with isActive = 0', (done) => {

            chai.request(server)
                .get('/api/user?isActive=0')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    result.should.be.an('array').that.has.a.lengthOf(0);
                    done()
                })
        })

        it('TC-202-5 Show users with isActive = 1', (done) => {
            chai.request(server)
                .get('/api/user?isActive=1')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    expect(status).to.equal(200)
                    expect(result[0].id).to.equal(1)
                    expect(result[0].firstName).to.equal('first');
                    expect(result[0].lastName).to.equal('last');
                    expect(result[0].isActive).to.equal(1);
                    expect(result[0].emailAdress).to.equal('name@server.nl');
                    expect(result[0].password).to.equal('secret');
                    expect(result[0].phoneNumber).to.equal('-');
                    expect(result[0].street).to.equal('street');
                    expect(result[0].city).to.equal('city');
                    done()
                })
        })

        it('TC-202-6 Show users with two filters', (done) => {
            chai.request(server)
                .get('/api/user?limit=2')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(200)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    status.should.be.a('number').that.equals(200)
                    expect(status).to.equal(200)
                    expect(result[0].id).to.equal(1)
                    expect(result[0].firstName).to.equal('first');
                    expect(result[0].lastName).to.equal('last');
                    expect(result[0].isActive).to.equal(1);
                    expect(result[0].emailAdress).to.equal('name@server.nl');
                    expect(result[0].password).to.equal('secret');
                    expect(result[0].phoneNumber).to.equal('-');
                    expect(result[0].street).to.equal('street');
                    expect(result[0].city).to.equal('city');
                    done()
                })
        })
    })



    //UC-203 User profiles
    describe('UC-203 User profile GET /api/user/profile', () => {
        it('TC-203-1 Invalid token', (done) => {
            chai.request(server)
                .get('/api/user/profile')
                .set(
                    'authorization',
                    'Bearer ' + 123
                )
                .end((req, res) => {
                    res.should.have.status(401)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body

                    status.should.be.a('number').that.equals(401)
                    message.should.be.a('string').that.equals('Not authorized')
                    done()
                })
        })

        it('TC-203-2 Valid token', (done) => {
            chai.request(server)
                .get('/api/user/profile')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((err, res) => {
                    assert.ifError(err)
                    res.should.have.status(200)
                    res.should.be.an('object')
                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'result')

                    let { status, result } = res.body

                    expect(status).to.equal(200)
                    expect(result.id).to.equal(1)
                    expect(result.firstName).to.equal('first');
                    expect(result.lastName).to.equal('last');
                    expect(result.isActive).to.equal(1);
                    expect(result.emailAdress).to.equal('name@server.nl');
                    expect(result.password).to.equal('secret');
                    expect(result.phoneNumber).to.equal('-');
                    expect(result.street).to.equal('street');
                    expect(result.city).to.equal('city');
                    expect(result.roles).to.equal('editor,guest');
                    done()
                })
        })
    })


    //UC-204 User Details
    describe('UC-204 User by ID GET /api/user/:id', () => {
        it('TC-204-1 Invalid token', (done) => {
            chai.request(server)
                .get('/api/user/profile')
                .set(
                    'authorization',
                    'Bearer ' + 123
                )
                .end((req, res) => {
                    res.should.have.status(401)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body

                    status.should.be.a('number').that.equals(401)
                    message.should.be.a('string').that.equals('Not authorized')
                    done()
                })
        })

        it("TC-204-2 User ID doesn't exist", (done) => {
            chai.request(server)
                .get("/api/user/0")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    let { status } = res.body;
                    status.should.equals(404);
                    done();
                });
        });

        it("TC-204-3 User ID exists", (done) => {
            chai.request(server)
                .get("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    let { status } = res.body;
                    status.should.equals(200);
                    done();
                });
        });
    })

    // UC-205 Modify user
    describe("UC-205 Modify user - PUT /api/user/:id", () => {
        it("TC-205-1 Required field missing", (done) => {
            chai.request(server)
                .put("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
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
                    message.should.be.an("string").that.equals("Email address not valid");
                    done();
                });
        });

        it('TC-205-3 Invalid phone number', (done) => {
            chai.request(server)
                .put('/api/user/1')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .send({
                    firstName: "Mick",
                    lastName: "Holster",
                    street: "street",
                    city: "City",
                    emailAdress: "test@test.com",
                    password: "secret",
                    phoneNumber: "123"
                })
                .end((req, res) => {
                    res.should.have.status(400)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body;
                    status.should.be.a('number').that.equals(400)
                    message.should.be.a('string').that.equals('Phone number not valid')
                    done()
                })
        })

        it("TC-205-4 User doesn't exists", (done) => {
            chai.request(server)
                .put("/api/user/0")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
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

        it('TC-205-5 Not logged in', (done) => {
            chai.request(server)
                .put('/api/user/420')
                .set(
                    'authorization',
                    'Bearer ' + 123
                )
                .send({
                    firstName: "Mick",
                    lastName: "Holster",
                    street: "street",
                    city: "City",
                    emailAdress: "test@test.com",
                    password: "secret"
                })
                .end((req, res) => {
                    res.should.have.status(401)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body;
                    status.should.be.a('number').that.equals(401)
                    message.should.be.a('string').that.equals('Not authorized')
                    done()
                })
        })

        it("TC-205-6 User has been modified successfully", (done) => {
            chai.request(server)
                .put("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
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
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    let { status } = res.body;
                    status.should.equals(400);
                    done();
                });
        });

        it('TC-206-2 Not logged in', (done) => {
            chai.request(server)
                .delete('/api/user/1')
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .set(
                    'authorization',
                    'Bearer ' + 123
                )
                .end((req, res) => {
                    res.should.have.status(401)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body;
                    status.should.be.a('number').that.equals(401)
                    message.should.be.a('string').that.equals('Not authorized')
                    done()
                })
        })

        it('TC-206-3 User is not the owner of the account', (done) => {
            chai.request(server)
                .delete('/api/user/1')
                .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
                .end((req, res) => {
                    res.should.have.status(403)
                    res.should.be.an('object')

                    res.body.should.be
                        .an('object')
                        .that.has.all.keys('status', 'message')

                    let { status, message } = res.body;
                    status.should.be.a('number').that.equals(403)
                    message.should.be.a('string').that.equals('Account is not yours')
                    done()
                })
        })

        it("TC-206-4 User has been deleted successfully", (done) => {
            chai.request(server)
                .delete("/api/user/1")
                .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
                .end((req, res) => {
                    let { status } = res.body;

                    status.should.equals(200);
                    res.body.should.have.property("message");

                    done();
                });
        });
    });
});