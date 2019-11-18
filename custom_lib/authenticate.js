const {verify} = require('./jwt');

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if(!token){
        // req.flash('err_msg', 'Please landing first!' );
        // res.status(403).json({result: 'FORBIDDEN'});
        res.redirect('/');
    }
    verify(token)
        .then(decoded=>{
            res.locals.userId = decoded._id;
            next();
        })
        .catch(err=>{
            req.flash('err_msg', err.message);
            res.status(500).json({result: 'VERIFY_SERVICE_FAILED'});
        })
}
module.exports = {isLoggedIn}
