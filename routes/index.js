var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ParkingSlot = require('../models/parkingSlot');
var {isLoggedIn} = require('../custom_lib/authenticate');
var {hash, compare} = require('../custom_lib/bcrypt');
var {verify, sign} = require('../custom_lib/jwt');
var crypto = require('crypto-js');
var encHex = require('crypto-js/enc-hex');
var encUtf8 = require('crypto-js/enc-utf8');
var {io, app} = require('../app');
var nodeMailer = require('nodemailer');

/* GET home page. */
router.get('/home', isLoggedIn, function (req, res, next) {
    ParkingSlot.find({})
        .then(parkingSlots => {
            if (!parkingSlots) {
                res.render('home-page', {parkingSlots: [], title: 'Home Page'});
            } else {
                res.render('home-page', {parkingSlots: parkingSlots, title: 'Home Page'});
            }
        })
        .catch(err => console.log(err));
});
router.get('/', function (req, res, next) {
    if (req.cookies.token) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});
router.post('/signup', function (req, res, next) {
    let passwordHash = 'not_hashed';
    let h = hash(req.body.password).then(function (hash, err) {
        passwordHash = hash;
        const user = new User({
            email: req.body.email,
            password: passwordHash,
            isLinkedToMomo: true
        });
        User.findOne({email: user.email}, {password: user.password}).then(u => {
            if (!u) {
                user.save().then(result => {
                    res.json({result: 'SIGNUP_SUCCESS'});
                    console.log('CREATED' + result);
                }).catch(err => {
                    res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (save)'});
                });
                // res.status(200).send(user).redirect('/login'); // CAUTION: For ejs
                return;
            }
            res.status(200).json({result: 'ALREADY_SIGNUP'});
        }).catch(err => {
            res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (findOne)'});
        });
    }).catch(err => {
        res.status(503).json({result: 'BCRYPT_SERVICE_FAILED (hash)'});
        console.log(err);
    });
});
router.get('/momo-return', (req, res) => {
    console.log(req.body);
    res.render('successful-payment', {title: 'Bill', data: req.body});
});
router.post('/receive-notify', (req, res, next) => {
    console.log(req.body);
    let d = {
        partnerCode: req.body.partnerCode,
        accessKey: req.body.accessKey,
        requestId: req.body.requestId,
        orderId: req.body.orderId,
        errorCode: req.body.errorCode,
        message: req.body.message,
        responseTime: Date.now().toString(),
        signature: '',
        extraData: {}
    };
    let data = `partnerCode=${d.partnerCode}&accessKey=${d.accessKey}&requestId=${d.requestId}&orderId=${d.orderId}&errorCode=${d.errorCode}&message=${d.message}&responseTime=${d.responseTime}&extraData=${d.extraData}`;
    let secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    let signature = crypto.HmacSHA256(data, secretKey);
    console.log(signature);
    console.log(signature.toString(encHex));
    d.signature = signature.toString(encHex);
    req.app.io.emit('news', {billMsg: d.message, billCode: d.errorCode});
    res.json(d);
});
router.post('/get-available-slot', (req, res, next) => {
    // var startTime = new Date(req.body.startTime);
    // var endTime = new Date(req.body.endTime);
    // var cmp = startTime < endTime;
    // const parkingSlot = new ParkingSlot({
    //     _id: req.body.stationId,
    //     stationAddress: req.body.stationAddress,
    //     slots: [
    //         {
    //             _id: 1,
    //             current: {
    //
    //             },
    //             future: [
    //                 {
    //                     _id: req.body.userId,
    //                     userName: req.body.email,
    //                     status: 'booked',
    //                     startTime: new Date(req.body.startTime),
    //                     package: req.body.package.value,
    //                     endTime: new Date(req.body.endTime)
    //                 }
    //             ]
    //         }
    //     ]
    // });
    // parkingSlot.save().then(r => {
    //     if (r) {
    //         res.json({result: r});
    //         return;
    //     }
    //     res.json({result: 'BOOKING_FAILED'});
    // }).catch(err => {
    //     console.log(err);
    //     res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (save)'});
    // });
    ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {$and: [{_id: req.body.stationId}, {'slots.future.endTime': {$lt: new Date(req.body.startTime)}}]} }, {$group: {_id: '$slots._id', future: {'$push': '$slots.future'}}}])
        .then(r => {
            var arr = [];
            if (r.length != 0) {
                r[0].future.forEach(i => {
                    arr.push(i);
                });
            }
            ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {$and: [{_id: req.body.stationId}, {'slots.future.startTime': {$gt: new Date(req.body.endTime)}}]}}, {$group: {_id: '$_id', future: {'$push': '$slots.future'}}}])
                .then(r => {
                    if (r.length != 0) {
                        r.forEach(i => {
                            arr.push(i.future);
                        });
                    }
                    if (arr.length === 0) {
                        res.json({result: 'SLOT_AVAILABLE'});
                        return;
                    }
                    ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {$and: [{_id: req.body.stationId}, {'slots.future': {$nin: arr}}]}}, {$group: {_id: '$_id', future: {'$push': '$slots.future'}}}])
                        .then(r => {
                            if (r.length === 0) {
                                res.json({result: 'SLOT_AVAILABLE'});
                                return;
                            }
                            res.json({result: 'SLOT_NOT_AVAILABLE'});
                        }).catch(err => {
                        console.log(err);
                        res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (aggregate)'});
                    })
                }).catch(err => {
                res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (aggregate)'});
            });
            // const info = {
            //     _id: req.body.userId,
            //     userName: req.body.email,
            //     status: 'booked',
            //     startTime: new Date(req.body.startTime),
            //     package: req.body.package.value,
            //     endTime: new Date(req.body.endTime)
            // };
            // r.slots[0].future.push(info);
            // r.save().then(r => {
            //     if (!r) {
            //         res.json({result: 'BOOKING_FAILED'});
            //         return;
            //     }
            //     res.json({result: 'BOOKING_SUCCESSFUL'});
            // }).catch(err => {
            //     console.log(err);
            //     res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (save)'});
            // });
            // ParkingSlot.find({'slots.future.startTime': {$gt: req.body.endTime}})
            //     .then(r => {
            //         r.forEach(i => {
            //             arr.push(i.slots.future.userName);
            //         });
            //         if (arr.length == 0) {
            //             res.json({result: 'AVAILABLE'});
            //             return;
            //         }
            //         ParkingSlot.find({'slots.future.userName': {$nin: arr}})
            //             .then(r => {
            //                 if (r.length == 0) {
            //                     ParkingSlot.find({'current.userName': ''}).then(r => {
            //                         if (r.length == 0) {
            //                             console.log('Current is empty');
            //                         }
            //                     })
            //                     const data =
            //                         ParkingSlot.save()
            //                     res.json({result: 'AVAILABLE'});
            //                     return;
            //                 }
            //                 res.json({result: 'NOT_AVAILABLE'});
            //             })
            //             .catch(err => {
            //                 res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (find with NOT IN)'});
            //             });
            //     })
            //     .catch(err => {
            //         console.log(err);
            //         res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (find with GREATER THAN)'});
            //     });
        })
        .catch(err => {
            console.log(err);
            res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (aggregate)'});
        });
});
router.get('/get-user-info', (req, res, next) => {
    verify(req.cookies.token)
        .then(decoded => {
            User.findById(decoded).then(r => {
                if (!r) {
                    res.json({result: 'USER_DELETED'});
                    return;
                }
                res.json({result: {email: r.email, userId: decoded._id}});
            }).catch(err => {
                console.log(err);
            });
        })
        .catch(err => {
            console.log(err.name);
            res.status(500).json({result: 'VERIFY_SERVICE_FAILED'});
        });
});
router.post('/reset-password', (req, res, next) => {
    var email = req.body.receiverMail;
    var secretKey = '1234qwer';
    var encryptEmail = crypto.AES.encrypt(email, secretKey);
    var encryptUrl = `http://localhost:4200/landing/password_reset?email=${encryptEmail}`;
    var transporter = nodeMailer.createTransport({
        service: 'Gmail',
        port: 465,
        secure: true,
        auth: {
            user: 'uit.smartparking@gmail.com',
            pass: '1234!@#$'
        }
    });
    let mailOptions = {
        from: '"Smart Parking System" uit.smartparking@gmail.com',
        to: req.body.receiverMail,
        subject: 'Reset your password',
        text: 'Just do it',
        html: `${req.body.plainContent}\n<a href="${encryptUrl}">${encryptUrl}</a>`
    };
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            res.status(503).json({result: 'NODEMAILER_SERVICE_FAILED'});
            return;
        }
        // res.json({result: info.response});
        res.json({result: 'SENT_SUCCESS'});
    });
});
router.post('/reset-for', (req, res, next) => {
    var secretKey = '1234qwer';
    // Chrome replace all "+" character into "%02" or something like that.
    // And request http param change "%02" to "space" character.
    // So this action will replace all "space" character into "+" using regex
    var encryptedEmail = req.body.encryptedEmail.replace(/ /g, "+");
    // Haven't test decrypt to encHEx yet, but encUtf8 work.
    var decryptedEmail = crypto.AES.decrypt(encryptedEmail, secretKey).toString(encUtf8);
    console.log('Email:' + decryptedEmail);
    let h = hash(req.body.password).then(function (hash, err) {
        const user = new User({
            email: decryptedEmail,
            password: hash,
            isLinkedToMomo: true
        });
        User.findOneAndUpdate({email: decryptedEmail}, {password: user.password}).then(updatedUser => {
            if (!updatedUser) {
                res.json({result: 'NOT_SIGNUP_YET'});
                return;
            }
            res.json({result: 'PASSWORD_CHANGED_SUCCESS'});
        }).catch(err => {
            res.status(503).json({result: 'MONGOOSE_SERVICE_FAILED (findOneAndUpdate)'});
        });
    }).catch(err => {
        res.status(503).json({result: 'BCRYPT_SERVICE_FAILED (hash)'});
    });
});
router.get('/login', (req, res) => {
    // verify(req.cookies.token)
    //     .then(decoded => {
    //       req.locals.userId = decoded._id;
    //       res.redirect('/home');
    //     })
    //     .catch(err => {
    //       req.flash('err_msg', err.message);
    //       res.status(500).json({result: 'VERIFY_SERVICE_FAILED'});
    //     });
    if (req.cookies.token) {
        res.redirect('/home');
        return;
    }
    res.render('login-page', {title: 'Login Page'});
});
router.post('/login', (req, res, next) => {
    const {email, password} = req.body;
    User.findOne({email}).then(result => {
        if (!result) {
            res.status(200).json({result: 'WRONG_EMAIL'});
            return;
        }
        compare(req.body.password, result.password).then(r => {
            if (!r) {
                res.status(200).json({result: 'WRONG_PASSWORD'});
                return;
            }
            sign({_id: result._id}, {expiresIn: '120'})
                .then(token => {
                    res.cookie('token', token, {maxAge: 10 * 60 * 1000}).json({result: 'LOGIN_SUCCESS', email: email});
                    console.log('Token: ' + token); // WARNING: ConsoleLog cause this sign function to run catch block or catch(). Error below
                    // UnhandledPromiseRejectionWarning: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
                    // CAUSE: req.cookie.token => Wrong | FIX: req.cookies.token => Correct
                })
                .catch(err => {
                    res.status(503).json({result: 'GENERATE_TOKEN_FAILED'});
                });
        }).catch(err => {
            res.status(503).json({result: 'BCRYPT_SERVICE_FAILED'});
        });
    }).catch(err => {
        res.status(503).json({result: 'QUERY_DATABASE_FAILED'});
    });
});

module.exports = router;
