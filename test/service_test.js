
const {getAuthorizerBy} = require('../service')

var appkey = 'D560776C-C374-461C-A522-EC315BD3DA3C-1';
var appid = 'wx53bbc3b2e52a882e';

getAuthorizerBy({appid}).then(function (res) {
	console.log(res);
}, function (err) {
	console.error('error', err);
})