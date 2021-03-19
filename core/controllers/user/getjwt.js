const jwt = require('jsonwebtoken')

module.exports = (user_id, tokenNumber) => {
    if (!process.env.TOKEN_SECRET) throw new Error('TOKEN_SECRET must be in env file')
    return jwt.sign({id: user_id, tokenNumber}, process.env.TOKEN_SECRET, {expiresIn: "2h"})
}