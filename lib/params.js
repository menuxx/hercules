
// 验证错误，就返回第一个发生错误的位置
export const autoValid = function (req) {
  req.getValidationResult().then(function (result) {
    if (!result.isEmpty()) {
      res.status(400).json({error: result.useFirstErrorOnly().array()});
      return;
    }
  })
}