var express = require('express');
var router = express.Router();
var User = require('../models/user');
var ParkingSlot = require('../models/parkingSlot');
var {isLoggedIn} = require('../custom_lib/authenticate');
var {hash, compare} = require('../custom_lib/bcrypt');
var {verify, sign} = require('../custom_lib/jwt');
var crypto = require('crypto-js');
var encHex = require('crypto-js/enc-hex');
var {io, app} = require('../app');

/* GET home page. */
router.get('/home', isLoggedIn, function(req, res, next) {
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
router.get('/', function(req, res, next) {
    if (req.cookies.token) {
        res.redirect('/home');
    } else {
        res.redirect('/landing');
    }
});
router.post('/signup', function (req, res, next) {
    let passwordHash = 'not_hashed';
    let h= hash(req.body.password).then(function(hash, err) {
        passwordHash = hash;
        const user = new User({
            email: req.body.email,
            password: passwordHash,
            isLinkedToMomo: true
        });
        User.findOne({email: user.email}, {password: user.password}).then(u => {
            if (!u) {
                user.save().then(result => {
                    console.log('CREATED', +result);
                }).catch(err => {
                    console.log(err);
                });
                res.status(200).send(user).redirect('/landing');
            }
            res.status(200).json({'ALREADY EXISTS': u});
        }).catch(err => {
            res.status(404);
        });
    }).catch(err => {
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
router.get('/landing', (req, res) => {
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
    res.render('landing-page', {title: 'Login Page'});
});
router.post('/landing', (req, res, next) => {
    const {email, password} = req.body;
    User.findOne({email}).then(result => {
        if (!result) {
            res.json({result: 'WRONG_EMAIL'});
            return ;
        }
        compare(req.body.password, result.password).then(r => {
            if (!r) {
                res.json({result: 'WRONG_PASSWORD'});
                return;
            }
            sign({_id: result._id})
                .then(token => {
                    res.cookie('token', token, {maxAge: 10*60*1000}).status(200).json({result: 'LOGIN_SUCCESS'});
                    console.log(req.cookie.token);
                    return;
                })
                .catch(err => {
                    res.json({result: 'GENERATE_TOKEN_FAILED'});
                    return;
                })
        }).catch(err => {
            res.json({result: 'BCRYPT_SERVICE_FAILED'});
            console.log(err);
        });
    }).catch(err => {
        res.json({result: 'QUERY_DATABASE_FAILED'});
        console.log(err);
    });
});

module.exports = router;
