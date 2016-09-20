var uuid = require("node-uuid");
var async = require("async");
var util = require('util');
var events = require('events');
var tools = require('../tools');
var log = tools.logger;
var adyenController = require('../controller/adyen');
var userController = require('../controller/user');
var walletController = require('../controller/wallet');

function WalletResponder() {
    var self = this;

    this.addCC = function (ws, data, callback) {
        if (!data.user_id || !data.additionalData) {
            log.debug && log.debug('user.getByEmail', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'additionalData']
            });
        }
        userController.getByUserId(data.user_id, function (err, user) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (user.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found', requiredFields: []});
            }
            var user = user.rows[0];

            // Check if user has already a reference
            userController.getReference(user.user_id, function (err, refs) {
                if (err) {
                    log.error(err.toString());
                    return callback(null, {
                        status: 500,
                        errorMsg: 'Transaction failed due to system failure',
                        requiredFields: []
                    });
                }
                var reference, first_time_reg = false;
                // First time registration of credit card
                if (refs.rows.length === 0) {
                    reference = uuid.v4();
                    first_time_reg = true;
                }
                else {
                    reference = refs.rows[0].reference;
                }
                // Build Adyen request
                var request = {};
                var amount = {value: 0, currency: 'EUR'}
                var recurring = {contract: config.kiggit.adyen.contract.recurring};
                request.amount = amount;
                request.recurring = recurring;
                request.shopperEmail = user.email;
                request.shopperReference = reference;
                request.reference = reference;
                request.merchantAccount = config.kiggit.adyen.opts.merchantAccount;
                request.additionalData = data.additionalData;
                request.shopperIP = data.shopperIP;

                adyenController.addCreditCard(request, function (err, res) {
                    if (res.errMessage) {
                        return callback(null, {
                            status: res.errBody.status,
                            errMessage: res.errMessage,
                            errBody: res.errBody
                        });
                    }
                    if (res.statusCode === 200) {
                        if (first_time_reg) {
                            userController.addReference(user.user_id, reference, function (err) {
                                if (err) {
                                    return callback(null, {
                                        status: 500,
                                        errorMsg: 'Transaction failed due to system failure'
                                    });
                                }
                                return callback(null, {status: 202, data: {}});
                            });
                        }
                        else {
                            return callback(null, {status: 202, data: {}});
                        }
                    }
                    else {
                        return callback(null, {status: res.statusCode, statusMessage: res.statusMessage});
                    }
                });

            });

        });
    };

    this.deposit = function (ws, data, callback) {
        if (!data.user_id || !data.card || !data.amount || !data.shopperIP) {
            log.debug && log.debug('user.getByEmail', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'card', 'amount', 'shopperIP']
            });
        }
        userController.getByUserId(data.user_id, function (err, user) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (user.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found', requiredFields: []});
            }
            var user = user.rows[0];

            // Get reference for user
            userController.getReference(user.user_id, function (err, ref) {
                if (err) {
                    log.error(err.toString());
                    return callback(null, {
                        status: 500,
                        errorMsg: 'Transaction failed due to system failure',
                        requiredFields: []
                    });
                }
                else if (!ref || !ref.rows || ref.rows.length === 0) {
                    return callback(null, {
                        status: 404,
                        errorMsg: 'No reference found for user - add credit card first'
                    });
                }
                else {
                    // TODO: Send 5% to Kiggit account
                    var actual_amount = data.amount * 0.95;

                    // Build Adyen request
                    var request = {};
                    var reference = ref.rows[0].reference;
                    var amount = {value: actual_amount, currency: 'EUR'}
                    var recurring = {contract: config.kiggit.adyen.contract.payment};
                    request.amount = amount;
                    request.recurring = recurring;
                    request.shopperEmail = user.email;
                    request.shopperReference = reference;
                    request.reference = reference;
                    request.merchantAccount = config.kiggit.adyen.opts.merchantAccount;
                    request.shopperIP = data.shopperIP;
                    request.selectedRecurringDetailReference = 'LATEST';
                    request.shopperInteraction = config.kiggit.adyen.opts.shopperInteraction;
                    request.card = data.card;

                    adyenController.deposit(request, function (err, res) {
                        if (res.errMessage) {
                            log.error(res.errMessage);
                            return callback(null, {
                                status: res.errBody.status,
                                errMessage: res.errMessage,
                                errBody: res.errBody
                            });
                        }
                        if (res.statusCode === 200) {
                            if (res.body.resultCode === 'Authorised') {
                                walletController.deposit(user.user_id, actual_amount, function (err, res) {
                                    walletController.amount(user.user_id, function (err, res1) {
                                        return callback(null, {status: 202, data: {balance: res1}});
                                    });
                                })
                            }
                            else {
                                log.error(res.body);
                                return callback(null, {
                                    status: 401,
                                    resultCode: res.body.resultCode,
                                    reason: res.body.refusalReason
                                });
                            }
                        }
                        else {
                            return callback(null, {status: res.statusCode, statusMessage: res.statusMessage});
                        }
                    });
                }

            });

        });
    };

    this.withdraw = function (ws, data, callback) {
        if (!data.user_id || !data.amount) {
            log.debug && log.debug('user.getByEmail', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id', 'amount']
            });
        }
        walletController.validateFunds(data.user_id, data.amount, function (err, valid) {
            if (!valid) {
                log.debug && log.debug('WalletResponder.withdraw', 'Rejecting request with insufficient funds', data);
                return callback(null, {
                    status: 401,
                    errorMsg: 'Rejecting request with insufficient funds'
                });
            }
            else {
                userController.getByUserId(data.user_id, function (err, user) {
                    if (err) {
                        log.error(err.toString());
                        return callback(err);
                    }
                    if (user.rows.length === 0) {
                        return callback(null, {status: 404, errorMsg: 'User not found', requiredFields: []});
                    }
                    var user = user.rows[0];

                    // Get reference for user
                    userController.getReference(user.user_id, function (err, ref) {
                        if (err) {
                            log.error(err.toString());
                            return callback(null, {
                                status: 500,
                                errorMsg: 'Transaction failed due to system failure',
                                requiredFields: []
                            });
                        }
                        // Build Adyen request
                        var request = {};
                        var reference = ref.rows[0].reference;
                        var amount = {value: data.amount, currency: 'EUR'}
                        var recurring = {contract: config.kiggit.adyen.contract.payment};
                        request.amount = amount;
                        request.recurring = recurring;
                        request.shopperEmail = user.email;
                        request.shopperReference = reference;
                        request.reference = reference;
                        request.merchantAccount = config.kiggit.adyen.opts.merchantAccount;
                        request.selectedRecurringDetailReference = 'LATEST';

                        adyenController.withdraw(request, function (err, res) {
                            log.debug('ADASDASDAS');
                            log.debug(res);
                            if (res.errMessage) {
                                //log.error(res.errMessage);
                                return callback(null, {
                                    status: res.errBody.status,
                                    errMessage: res.errMessage,
                                    errBody: res.errBody
                                });
                            }
                            if (res.statusCode === 200) {
                                walletController.withdraw(user.user_id, amount.value, function (err, res) {
                                    walletController.amount(user.user_id, function (err, res1) {
                                        return callback(null, {status: 202, data: {balance: res1}});
                                    });
                                })
                            }
                            else {
                                return callback(null, {status: res.statusCode, statusMessage: res.statusMessage});
                            }
                        });

                    });

                });
            }
        });
    };

    this.retrieveCCs = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('wallet.retrieveCC', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.getByUserId(data.user_id, function (err, user) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (user.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found'});
            }
            var user = user.rows[0];

            // Get reference for user
            userController.getReference(user.user_id, function (err, ref) {
                if (err) {
                    log.error(err.toString());
                    return callback(null, {
                        status: 500,
                        errorMsg: 'Transaction failed due to system failure'
                    });
                }
                else if (!ref || !ref.rows || ref.rows.length === 0) {
                    return callback(null, {
                        status: 404,
                        errorMsg: 'No reference found for user - add credit card first'
                    });
                }
                else {
                    // Build Adyen request
                    var request = {};
                    var recurring = {contract: config.kiggit.adyen.contract.payment};
                    request.recurring = recurring;
                    request.shopperReference = ref.rows[0].reference;
                    request.merchantAccount = config.kiggit.adyen.opts.merchantAccount;

                    adyenController.retrieveCCs(request, function (err, res) {
                        if (!res) {
                            return callback(null, {
                                status: 404,
                                errorMsg: 'No credit card details found for user'
                            });
                        }
                        else if (res && res.statusCode === 200) {
                            return callback(null, {status: 202, data: { details: res.body }});
                        }
                        else if (res && res.statusCode === 401) {
                            return callback(null, {
                                status: 401,
                                errorMsg: 'Unauthorized'
                            });
                        }
                        else if (res && res.errMessage) {
                            log.error(res.errMessage);
                            return callback(null, {
                                status: 500,
                                errMessage: res.errMessage,
                            });
                        }
                        else {
                            return callback(null, {status: res.statusCode, statusMessage: res.statusMessage});
                        }
                    });
                }
            });

        });
    };

    this.disableCC = function (ws, data, callback) {
        if (!data.user_id) {
            log.debug && log.debug('wallet.retrieveCC', 'Rejecting request with insufficient or bad data', data);
            return callback(null, {
                status: 400,
                errorMsg: 'Rejecting request with insufficient or bad data',
                requiredFields: ['user_id']
            });
        }
        userController.getByUserId(data.user_id, function (err, user) {
            if (err) {
                log.error(err.toString());
                return callback(err);
            }
            if (user.rows.length === 0) {
                return callback(null, {status: 404, errorMsg: 'User not found'});
            }
            var user = user.rows[0];

            // Get reference for user
            userController.getReference(user.user_id, function (err, ref) {
                if (err) {
                    log.error(err.toString());
                    return callback(null, {
                        status: 500,
                        errorMsg: 'Transaction failed due to system failure'
                    });
                }
                else if (!ref || !ref.rows || ref.rows.length === 0) {
                    return callback(null, {
                        status: 404,
                        errorMsg: 'No reference found for user - add credit card first'
                    });
                }
                else {
                    if (data.recurringDetailReference) {

                    }
                    // Build Adyen request
                    var request = {};
                    request.shopperReference = ref.rows[0].reference;
                    request.merchantAccount = config.kiggit.adyen.opts.merchantAccount;
                    if (data.recurringDetailReference) {
                        request.recurringDetailReference = data.recurringDetailReference;
                    }
                    adyenController.disableCCs(request, function (err, res) {
                        if (!res) {
                            return callback(null, {
                                status: 404,
                                errorMsg: 'No credit card details found for user'
                            });
                        }
                        else if (res && res.statusCode === 200) {
                            return callback(null, {status: 202, data: { details: res.body }});
                        }
                        else if (res && res.statusCode === 401) {
                            return callback(null, {
                                status: 401,
                                errorMsg: 'Unauthorized'
                            });
                        }
                        else if (res && res.errMessage) {
                            log.error(res.errMessage);
                            return callback(null, {
                                status: 500,
                                errMessage: res.errMessage,
                            });
                        }
                        else {
                            return callback(null, {status: res.statusCode, statusMessage: res.statusMessage});
                        }
                    });
                }
            });

        });
    };
};


util.inherits(WalletResponder, events.EventEmitter);
module.exports = new WalletResponder();