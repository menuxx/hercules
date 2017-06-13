// 验证错误，就返回第一个发生错误的位置
export const autoValid = function (req, resp) {
	return req.getValidationResult().then(function (result) {
		if (!result.isEmpty()) {
			resp.status(400).render('error', {error: result.useFirstErrorOnly().array().map(err => err.msg).join(' | ')});
			return Promise.reject(result);
		}
		return Promise.resolve(true);
	})
}

export const jsonAutoValid = function (req, resp) {
	return req.getValidationResult().then(function (result) {
		if (!result.isEmpty()) {
			resp.status(400).json({error: result.useFirstErrorOnly().array()});
			return Promise.reject(result);
		}
		return Promise.resolve(true);
	})
}