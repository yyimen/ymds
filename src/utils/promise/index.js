exports.sleep = function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 *
 * @param {*} promise
 * @returns {{result:any,ok:boolean}}
 */
exports.pmObj = function (promise) {
    return promise
        .then(function (result) {
            return {
                ok: true,
                result: result,
            };
        })
        .catch(function (err) {
            return {
                ok: false,
                err: err.message,
            };
        });
};

exports.pm2Array = function (promise) {
    return promise
        .then(function (result) {
            return [null, result];
        })
        .catch(function (err) {
            return [err.message, undefined];
        });
};
