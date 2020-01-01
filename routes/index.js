var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ParkingSlot = require('../models/parkingSlot');
var UserPressed = require('../models/userPressed');
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
            lang: req.body.lang
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
router.get('/get-user-pressed', (req, res, next) => {
    const stationId = req.query.stationId;
    UserPressed.aggregate([{$match: {_id: Number(stationId)}}, {$project: {_id: 0, list: '$pressedList'}}])
        .then(r => {
            var list = [];
            r[0].list.forEach(s => {
                list.push(s.slotId);
            });
            res.json({list: list});
    }).catch(err => {
        console.log(err);
    });
});
router.post('/save-user-pressed', (req, res, next) => {
    if (req.body.errorCode !== '0') return;
    const extraData = req.body.extraData.split('-');
    UserPressed.findOne({_id: Number(extraData[0])}).then(r => {
        if (!r) {
            var pressedList = [];
            const userPressed = {
                _id: 1,
                slotId: Number(extraData[1]),
                userName: extraData[2]
            };
            pressedList.push(userPressed);
            const newObj = new UserPressed({
                _id: Number(extraData[0]),
                pressedList: pressedList
            });
            newObj.save().then(r => {
                if (!r) {
                    res.json({result: 'NOT_READY_TO_PARK'});
                    return;
                }
                User.updateOne({email: userPressed.userName}, {$set: {status: 'paid'}}).then(r => {
                    if (!r) {
                        res.json({result: 'NOT_READY_TO_PARK'});
                        return;
                    }
                    req.app.io.emit('user-status', {status: 'paid'});
                    res.json({result: 'READY_TO_PARK'});
                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            })
            return;
        }
        var pressedList = r.pressedList;
        const userPressed = {
            _id: pressedList[pressedList.length-1]._id + 1,
            slotId: Number(extraData[1]),
            userName: extraData[2]
        };
        pressedList.push(userPressed);
        UserPressed.updateOne({_id: Number(extraData[0])}, {$set: {pressedList: pressedList}}).then(r => {
            if (!r) {
                res.json({result: 'CONTROL_FAILED'});
                return;
            }
            User.updateOne({email: userPressed.userName}, {$set: {status: 'paid'}}).then(r => {
                if (!r) {
                    res.json({result: 'CONTROL_FAILED'});
                    return;
                }
                req.app.io.emit('user-status', {status: 'paid'});
                res.json({result: 'CONTROL_SUCCESSFUL'});
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log(err);
        });
    }).catch(err => {
        console.log(err);
    });
});
router.post('/get-available-slot', (req, res, next) => {
    ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {_id: req.body.stationId}}, {$sort: {'slots.future.startTime': 1}}, {$group: {_id: '$slots._id', futures: {'$push': '$slots.future'}}}, {$project: {_id: '$_id', future: '$futures' ,total: {$size: '$futures'}}}, {$sort: {total: 1}}])
        .then(r => {
            ParkingSlot.aggregate([{$match: {_id: req.body.stationId}}, {$project: {_id: 0, capacity: '$capacity'}}]).then(capacity => {
                if (r.length !== capacity[0].capacity) {
                    res.json({result: 'SLOT_AVAILABLE'});
                    return;
                }
                const x = new Date(req.body.startTime);
                const y = new Date(req.body.endTime);
                for (var i = 0; i < r.length; i++) {
                    var s = r[i].future;
                    if (s.length === 1) {
                        if (y < s[0].startTime || x > s[0].endTime) {
                            res.json({result: 'SLOT_AVAILABLE'});
                            return;
                        }
                    } else {
                        for (var j = 0; j < s.length - 1; j++) {
                            var end = s[j].endTime;
                            var start = s[j + 1].startTime;
                            if ((end < x && y < start) || (y < s[0].startTime) || (x > s[s.length - 1].endTime)) {
                                res.json({result: 'SLOT_AVAILABLE'});
                                return;
                            }
                        }
                    }
                }
                res.json({result: 'SLOT_NOT_AVAILABLE'});
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
        console.log(err);
    });
});
router.post('/extending', (req, res, next) => {
    if (req.body.errorCode !== '0') return;
    const extraData = req.body.extraData.split('-');
    const slotId = Number(extraData[1]);
    var flag = false;
    ParkingSlot.aggregate([{$unwind: '$slots'}, {$match: {_id: Number(extraData[0])}}, {$sort: {'slots._id': 1}}, {$group: {_id: '$_id', slots: {'$push': '$slots'}}}])
        .then(r => {
            ParkingSlot.aggregate([{$match: {_id: Number(extraData[0])}}, {$project: {_id: 0, capacity: '$capacity'}}]).then(capacity => {
                var info = r[0].slots;
                var futures = [];
                if (info.length === capacity[0].capacity) {
                    futures = info[slotId-1].future;
                } else {
                    futures = info[info.map(s => {return s._id}).indexOf(slotId)].future;
                }
                for (var i = 0; i< futures.length; i++) {
                    const email = futures[i].userName;
                    if (extraData[2] === email) {
                        var newEndTime = new Date(extraData[4]);
                        newEndTime.setHours(new Date(extraData[4]).getHours() + Number(extraData[3]));
                        if (futures.length === 1) {
                            futures[i].endTime = newEndTime;
                            futures[i].package += Number(extraData[3]);
                            flag = true;
                            break;
                        } else {
                            if (futures[i+1]) {
                                if (newEndTime < futures[i+1].endTime) {
                                    futures[i].endTime = newEndTime;
                                    futures[i].package += Number(extraData[3]);
                                    flag = true;
                                    break;
                                }
                            } else {
                                futures[i].endTime = newEndTime;
                                futures[i].package += Number(extraData[3]);
                                flag = true;
                                break;
                            }
                        }
                    }
                }
                if (flag) {
                    ParkingSlot.updateOne({_id: Number(extraData[0])}, {$set: {slots: info}})
                        .then(r => {
                            if (r) {
                                res.json({result: 'EXTEND_SUCCESSFUL'});
                                req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'EXTENDING'});
                                return;
                            }
                            res.json({result: 'EXTEND_FAILED'});
                            req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'EXTENDING'});
                        }).catch(err => {
                        console.log(err);
                    });
                }
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log(err);
    });
});
router.post('/canceling', (req, res, next) => {
    const {stationId, slotId, userName} = req.body;
    ParkingSlot.findOne({_id: stationId}).then(r => {
        if (!r) {
            res.json({result: 'CANCELLING_FAILED'});
            return;
        }
        for (var i = 0; i < r.slots.length; i++) {
            var s = r.slots[i];
            if (s._id === slotId) {
                s.future = s.future.filter(f => f.userName != userName);
                break;
            }
        }
        ParkingSlot.updateOne({_id: stationId}, {$set: {slots: r.slots}}).then(r => {
            if (!r) {
                res.json({result: 'CANCELLING_FAILED'});
                return;
            }
            User.updateOne({email: userName}, {$set: {status: 'none'}}).then(r => {
                if (!r) {
                    res.json({result: 'CANCELLING_FAILED'});
                    return;
                }
                req.app.io.emit('user-status', {status: 'none'});
                res.json({result: 'CANCELLING_SUCCESSFUL'});
            });
        }).catch(err => {
            console.log(err);
        })
    }).catch(err => {
        console.log(err);
    });
});
router.post('/booking', (req, res, next) => {
    if (req.body.errorCode !== '0') return;
    let info = req.body.extraData.split('-');
    ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {_id: Number(info[0])}}, {$sort: {'slots.future.startTime': 1}}, {
        $group: {
            _id: '$slots._id',
            future: {'$push': '$slots.future'}
        }
    }, {$sort: {_id: 1}}])
        .then(r => {
            ParkingSlot.aggregate([{$match: {_id: Number(info[0])}}, {$project: {_id: 0, capacity: '$capacity'}}]).then(capacity => {
                var slot = [];
                var flag = false;
                var index = 1;
                console.log(r);
                r.forEach(i => {
                    slot.push(i._id);
                });
                for (var i = 0; i < r.length - 1; i++) {
                    for (var j = i + 1; j < r.length; j++) {
                        if (r[i].future.length > r[j].future.length) {
                            var temp = r[i];
                            r[i] = r[j];
                            r[j] = temp;
                        }
                    }
                }
                if (slot.length === capacity[0].capacity) {
                    const x = new Date(info[3]);
                    const y = new Date(info[5]);
                    for (var i = 0; i < r.length; i++) {
                        if (flag) break;
                        var s = r[i].future;
                        if (s.length === 1) {
                            if (y < s[0].startTime || x > s[0].endTime) {
                                const d = {
                                    _id: info[1],
                                    userName: info[2],
                                    status: 'booked',
                                    startTime: new Date(info[3]),
                                    package: info[4],
                                    endTime: new Date(info[5])
                                };
                                s.push(d);
                                flag = true;
                                break;
                            }
                        }
                        for (var j = 0; j < s.length - 1; j++) {
                            var end = s[j].endTime;
                            var start = s[j + 1].startTime;
                            if ((end < x && y < start) || (y < s[0].startTime) || (x > s[s.length - 1].endTime)) {
                                //Book here
                                const d = {
                                    _id: info[1],
                                    userName: info[2],
                                    status: 'booked',
                                    startTime: new Date(info[3]),
                                    package: Number(info[4]),
                                    endTime: new Date(info[5])
                                };
                                s.push(d);
                                flag = true;
                                break;
                            }
                        }
                    }
                    if (flag) {
                        ParkingSlot.updateOne({_id: Number(info[0])}, {$set: {slots: r}}).then(data => {
                            if (data) {
                                User.updateOne({email: info[2]}, {$set: {status: 'staked'+info[4]}}).then(data => {
                                    if (data) {
                                        res.json({result: 'BOOKING_SUCCESSFUL'});
                                        req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'BOOKING'});
                                        req.app.io.emit('user-status', {status: 'staked'+info[4]});
                                        return;
                                    }
                                    res.json({result: 'UPDATE_USER_STAKE_STATE_FAILED'});
                                }).catch(err => {
                                    console.log(err);
                                });
                                return;
                            }
                            req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'BOOKING'});
                            res.json({result: 'BOOKING_FAILED'});
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                } else {
                    while (slot.indexOf(index) > -1) {
                        index++;
                    }
                    const d = {
                        _id: index,
                        future: [
                            {
                                _id: info[1],
                                userName: info[2],
                                status: 'booked',
                                startTime: new Date(info[3]),
                                package: Number(info[4]),
                                endTime: new Date(info[5])
                            }
                        ]
                    }
                    r.push(d);
                    ParkingSlot.updateOne({_id: Number(info[0])}, {$set: {slots: r}}).then(data => {
                        if (data) {
                            User.updateOne({email: info[2]}, {$set: {status: 'staked'+info[4]}}).then(data => {
                                if (data) {
                                    req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'BOOKING'});
                                    req.app.io.emit('user-status', {status: 'staked'+info[4]});
                                    res.json({result: 'BOOKING_SUCCESSFUL'});
                                    return;
                                }
                                req.app.io.emit('news', {billMsg: req.body.message, billCode: req.body.errorCode, action: 'BOOKING'});
                                res.json({result: 'BOOKING_FAILED'});
                            }).catch(err => {
                                console.log(err);
                            });
                        }
                    }).catch(err => {
                        console.log(err);
                    });
                }
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
        console.log(err);
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
                ParkingSlot.aggregate([{$unwind: '$slots'}, {$unwind: '$slots.future'}, {$match: {'slots.future._id': decoded._id}}, {$project: {stationId: '$_id', slotId: '$slots._id', endTime: '$slots.future.endTime'}}])
                    .then(rr => {
                        if (rr.length === 0) {
                            res.json({result: {email: r.email, userId: decoded._id, status: r.status, stationId: 0, slotId: 0, endTime: '', lang: r.lang}});
                            return;
                        }
                        res.json({result: {email: r.email, userId: decoded._id, status: r.status, stationId: rr[0].stationId, slotId: rr[0].slotId, endTime: rr[0].endTime, lang: r.lang}});
                    });
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
