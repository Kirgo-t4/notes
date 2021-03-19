const { validationResult } = require('express-validator')

const checkValidation = (_, req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().reduce((prev, item) => {
            prev[item.param] = item.msg
            return prev
        }, {})

        return {
            break: true,
            message: messages,
            http_code: 400,
            result: "Validation error"
        }

    }
    return {
        result: "Validation passed",
        http_code: 200
    }
}

module.exports = {checkValidation}