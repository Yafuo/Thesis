const jwt = require('jsonwebtoken')
const SECRET_KEY = '1234qwer';

async function sign(obj) {
    const token = jwt.sign(obj, SECRET_KEY, {expiresIn:1200});
    return token;
}
async function verify(obj) {
    const decoded = jwt.verify(obj, SECRET_KEY);
    return decoded;
}
module.exports = {sign, verify}
