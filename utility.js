/* generates n random characters from [0-9,a-z] using Math.random */
exports.rand_string = function(n) {
    if (n <= 0) {
        return '';
    }
    return Math.floor(Math.random()*Math.pow(36,n)).toString(36);
}
