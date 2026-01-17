class Utils {
    static delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }

    static log(message, callback = null) {
        console.log(`[Bot] ${message}`);
        if (callback) callback(message);
    }
}

module.exports = Utils;
