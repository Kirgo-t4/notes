const asyncHandler = require('express-async-handler');


const apiHandler = (processors_) => {
    /**
     * Последовательно запускает функции из processors_ которые должны возвращать резултат вида:
     * {
     * count - кол-во записей (нужно для пагинации),
     * result - результат,
     * message - сообщение с комментарием,
     * break - если true то нет перехода к следующим обработчикам,
     * http_code - статус http
     * }
     */
    return asyncHandler(async (req, res) => {

        const processors = processors_ instanceof Array ? processors_ : [processors_]

        let iterationResult = {
            count: undefined,
            result: undefined,
            message: undefined,
            break: undefined,
            http_code: undefined
        }

        for (let proc of processors) {
            iterationResult = await proc(iterationResult, req);
            if (iterationResult?.break) break;
        }

        const {result, http_code, count, message} = iterationResult || {}

        if (typeof http_code === 'undefined' || !result && !message) {
            res.status(500).json({
                message: "Unknown result",
                err: true
            })
            return
        }

        if (http_code > 300) {
            console.log(`request: ${req.originalUrl}, status:(${http_code}) message:${JSON.stringify(message)}`)
            res.status(iterationResult.http_code).json({
                result,
                message,
                err: true
            })
            return
        }
        res.status(http_code).json({
            result,
            message,
            count: count,
            err: false
        })
    })
}


module.exports = apiHandler