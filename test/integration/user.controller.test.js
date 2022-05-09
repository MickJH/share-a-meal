const chai = require('chai');
const chaiHTTP = require('chai-http');
const server = require('../../index');
let testDatabase = [];

chai.should();
chai.use(chaiHTTP);

describe('Manage users', () => {
    describe('UC-201 add users  /api/user', () => {
        beforeEach((done) => {
            testDatabase = [];
            done();
        })

        it('When a required input is missing, a valid error should be returned', (done) => {
            chai
                .request(server)
                .post('/api/user')
                .send({
                    //Mail is missing.
                })
                .end((err, res) => {
                    res.should.be.an('object');
                    let { status, result } = res.body;
                    status.should.equals(400);
                    result.should.be.a('string').that.equals('First name must be a string');
                })
            done()
        })
    })
})