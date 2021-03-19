const crypto = require('crypto')

module.exports = () => {
    return crypto.randomBytes(40).toString('hex')
}