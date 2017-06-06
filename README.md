# hercules
微信平台小程序大力士


## node-debug 

错误输出类别

info, error, api

wxerror, wxlog

输出标记:

* 微信小程序接口相关 (例如，代码提交，审核，url管理，成员管理)
  wxlite_api

* 微信开放接口相关 (第三方token获取，第三方信息获取)
  wx3rd_api

* 微信其他接口相关 (发送自定义消息)
  wx_api

export DEBUG=info,error,api

db t_corp 表中依赖 字段

- authorizer_appid 对应小程序 appid

- authorize_status 小程序授权状态
 * 授权成功将该字段修为 1 
 * 取消授权或没有授权为 2


