var helpers = require('../lib/test-helpers');
var responder = require('../lib/ws-responder');
var assert = require('assert');
var tools = require('../lib/tools');
var log = tools.logger;
var uuid = require("node-uuid");

describe('User test', function () {
    this.timeout(5000);

    before(function (done) {
        ws = helpers.getAuthorizedFakeWebSocket(helpers.userId1, helpers.userName1, helpers.userDate1),
            done();
    });
    after(function (done) {
        done();
    });

    describe('Register user', function () {

        it('Success', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 202);
                msg1 = {
                    "data": {
                        "user_id": res.data.user_id
                    },
                    "action": "user:getById",
                    "id": 48179122,
                    "status": 0,
                    "type": "request"
                }
                responder.respond(ws, msg1, function (err, res1) {
                    assert.equal(res1.data.user.first_name, "Jacob");
                    assert.equal(res1.data.user.last_name, "Nøddebo");
                    done();
                });
            });
        });
        it('Error - mandatory fields missing', function (done) {
            msg = {
                "data": {
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
                done();

            });
        });
        it('Error - email has wrong format', function (done) {
            msg = {
                "data": {
                    "email": "jacobfriaminds.dk",
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Email address has wrong format');
                done();
            });
        });
        it('Error - email address already in use', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                responder.respond(ws, msg, function (err, res1) {
                    assert.equal(res1.status, 400);
                    assert.equal(res1.errorMsg, 'Email address is already in use');
                    done();
                });
            });
        });
    });

    describe('Authenticate user', function () {
        it('Success', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 202);
                msg = {
                    "data": {
                        "email": email,
                        "password": "1234"
                    },
                    "action": "user:authenticate",
                    "id": 1982951520,
                    "status": 0,
                    "type": "request"
                }
                responder.respond(ws, msg, function (err, res) {
                    assert.equal(res.status, 200);
                    done();
                });
            });
        });
        it('Error - mandatory fields missing', function (done) {
            msg = {
                "data": {},
                "action": "user:authenticate",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
                done();
            });
        });
        it('Wrong email format', function (done) {
            msg = {
                "data": {
                    "email": "jn122friaminds.dk",
                    "password": "1234"
                },
                "action": "user:authenticate",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Invalid email address');
                done();
            });
        });
        it('Wrong email', function (done) {
            msg = {
                "data": {
                    "email": "jn122friaminds.dk",
                    "password": "123456"
                },
                "action": "user:authenticate",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Invalid email address');
                done();
            });
        });
        it('User was previously deleted', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 202);
                msg = {
                    "data": {
                        "user_id": res.data.user_id
                    }
                    ,
                    "action": "user:delete",
                    "id": 1982951520,
                    "status": 0,
                    "type": "request"
                }
                responder.respond(ws, msg, function (err, res1) {
                    assert.equal(res1.status, 202);
                    msg = {
                        "data": {
                            "email": email,
                            "password": "1234"
                        },
                        "action": "user:authenticate",
                        "id": 1982951520,
                        "status": 0,
                        "type": "request"
                    }
                    responder.respond(ws, msg, function (err, res2) {
                        assert.equal(res2.status, 404);
                        done();
                    });
                });
            });
        });
    });

    describe('Newpasswd user', function () {
        it('Success', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 202);
                msg = {
                    "data": {
                        "user_id": res.data.user_id
                    },
                    "action": "user:getById",
                    "id": 48179122,
                    "status": 0,
                    "type": "request"
                };
                responder.respond(ws, msg, function (err, res1) {
                    assert.equal(res1.status, 200);
                    msg = {
                        "data": {
                            "email": res1.data.user.email
                        },
                        "action": "user:newpasswd",
                        "id": 1982951520,
                        "status": 0,
                        "type": "request"
                    };
                    responder.respond(ws, msg, function (err, res1) {
                        assert.equal(res1.status, 201);
                        msg = {
                            "data": {
                                "user_id": res.data.user_id
                            },
                            "action": "user:getById",
                            "id": 48179122,
                            "status": 0,
                            "type": "request"
                        };
                        responder.respond(ws, msg, function (err, res2) {
                            assert.equal(res2.status, 200);
                            assert.notEqual(res2.data.user.password, "1234");
                            done();
                        });
                    });
                });
            });
        });
        it('Error - mandatory fields missing', function (done) {
            msg = {
                "data": {},
                "action": "user:newpasswd",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
                done();
            });
        });
    });

    describe('Uppasswd user', function () {
        it('Success', function (done) {
            // TODO
            done();
        });
        it('Error - mandatory fields missing', function (done) {
            msg = {
                "data": {
                    "password": "1234"
                },
                "action": "user:uppasswd",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 400);
                assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
                msg1 = {
                    "data": {
                        "user_id": "895834ba-a839-44ac-9c1c-4a435ecdca3a"
                    },
                    "action": "user:uppasswd",
                    "id": 1982951520,
                    "status": 0,
                    "type": "request"
                };
                responder.respond(ws, msg1, function (err, res1) {
                    assert.equal(res1.status, 400);
                    assert.equal(res1.errorMsg, 'Rejecting request with insufficient or bad data');
                    done();
                });
            });
        });
    });

    describe('Setcode user', function () {
        it('Success', function (done) {
            var email_uuid = uuid.v4();
            var email = email_uuid.toString() + "@friaminds.dk";
            msg = {
                "data": {
                    "email": email,
                    "password": "1234",
                    "first_name": "Jacob",
                    "last_name": "Nøddebo",
                    "device": "android"
                },
                "action": "user:register",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg, function (err, res) {
                assert.equal(res.status, 202);
                msg1 = {
                    "data": {
                        "user_id": res.data.user_id,
                        "pincode": "1234",
                        "password": "1234"
                    },
                    "action": "user:setcode",
                    "id": 1982951520,
                    "status": 0,
                    "type": "request"
                };
                responder.respond(ws, msg1, function (err, res1) {
                    assert.equal(res1.status, 202);
                    msg2 = {
                        "data": {
                            "user_id": res.data.user_id
                        },
                        "action": "user:getById",
                        "id": 1982951520,
                        "status": 0,
                        "type": "request"
                    };
                    responder.respond(ws, msg2, function (err, res2) {
                        assert.equal(res2.data.user.pin_code, 1234);
                        done();
                    });
                });
            });
        });
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {
                "pincode": "1234"
            },
            "action": "user:setcode",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            msg1 = {
                "data": {
                    "user_id": "895834ba-a839-44ac-9c1c-4a435ecdca3a"
                },
                "action": "user:setcode",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            };
            responder.respond(ws, msg1, function (err, res1) {
                assert.equal(res1.status, 400);
                assert.equal(res1.errorMsg, 'Rejecting request with insufficient or bad data');
                done();
            });
        });
    });
});

describe('Friends user', function () {
    it('Success', function (done) {
        // TODO
        done();
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {},
            "action": "user:friends",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            done();
        });
    });
});

describe('Update user', function () {
    it('Success', function (done) {
        // TODO
        done();
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {},
            "action": "user:update",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            done();
        });
    });
});

describe('Delete user', function () {
    it('Success', function (done) {
        var email_uuid = uuid.v4();
        var email = email_uuid.toString() + "@friaminds.dk";
        msg = {
            "data": {
                "email": email,
                "password": "1234",
                "first_name": "Jacob",
                "last_name": "Nøddebo",
                "device": "android"
            },
            "action": "user:register",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 202);
            msg1 = {
                "data": {
                    "user_id": res.data.user_id
                },
                "action": "user:delete",
                "id": 1982951520,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg1, function (err, res1) {
                assert.equal(res1.status, 202);
                msg2 = {
                    "data": {
                        "user_id": res.data.user_id
                    },
                    "action": "user:getById",
                    "id": 1982951520,
                    "status": 0,
                    "type": "request"
                };
                responder.respond(ws, msg2, function (err, res2) {
                    assert.equal(res2.status, 200);
                    assert.notEqual(res2.data.user.deleted, new Date());
                    done();
                });
            });
        });
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {},
            "action": "user:delete",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            done();
        });
    });
});

describe('GetById user', function () {
    it('Success', function (done) {
        var email_uuid = uuid.v4();
        var email = email_uuid.toString() + "@friaminds.dk";
        msg = {
            "data": {
                "email": email,
                "password": "1234",
                "first_name": "Jacob",
                "last_name": "Nøddebo",
                "device": "android"
            },
            "action": "user:register",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 202);
            msg1 = {
                "data": {
                    "user_id": res.data.user_id
                },
                "action": "user:getById",
                "id": 48179122,
                "status": 0,
                "type": "request"
            }
            responder.respond(ws, msg1, function (err, res1) {
                assert.equal(res1.data.user.first_name, "Jacob");
                assert.equal(res1.data.user.last_name, "Nøddebo");
                done();
            });
        });    });
    it('User not found 404', function (done) {
        msg = {
            "data": {
                "user_id": uuid.v4()
            },
            "action": "user:getById",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 404);
            assert.equal(res.errorMsg, 'User not found');
            done();
        });
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {},
            "action": "user:getById",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            done();
        });
    });
});

describe('GetByEmail user', function () {
    it('Success', function (done) {
        // TODO
        done();
    });
    it('User not found 404', function (done) {
        msg = {
            "data": {
                "email": uuid.v4().toString() + "@friaminds.dk"
            },
            "action": "user:getByEmail",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 404);
            assert.equal(res.errorMsg, 'User not found');
            done();
        });
    });
    it('Error - mandatory fields missing', function (done) {
        msg = {
            "data": {},
            "action": "user:getByEmail",
            "id": 1982951520,
            "status": 0,
            "type": "request"
        };
        responder.respond(ws, msg, function (err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.errorMsg, 'Rejecting request with insufficient or bad data');
            done();
        });
    });
});

