const bcrypt = require('bcrypt')

module.exports = async (pass) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(pass, salt)
}