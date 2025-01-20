var bcrypt = require('bcryptjs');

const hashPassword = (pass) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(pass, salt)
}

const comparePass = (raw, hash) => {
    return bcrypt.compareSync(raw, hash);
}

module.exports = {
    hashPassword,
    comparePass,
}