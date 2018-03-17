# hercules
微信平台小程序大力士


## node-debug 

错误输出类别

```
info, error, api
wxerror, wxlog
```

输出标记:

* 微信小程序接口相关 (例如，代码提交，审核，url管理，成员管理)
  > wxlite_api

* 微信开放接口相关 (第三方token获取，第三方信息获取)
  > wx3rd_api

* 微信其他接口相关 (发送自定义消息)
  > wx_api

```
export DEBUG=info,error,api

db t_corp 表中依赖 字段
```

- authorizer_appid 对应小程序 appid

- authorize_status 小程序授权状态
 * 授权成功将该字段修为 1 
 * 取消授权或没有授权为 2


环境变量 URL_GET_AUTHORIZE

获取 商户详细信息 接口

get 请求

```
querystring 会有 appid 或 appkey

get_url?appid=cjnw4rv3j2mcn5432918uxn

get_url?appkey=EFA1BA4B-633B-423F-B511-1FB57D361FCA
```

需要返回的字段

```
shopName                  店铺名称
masterName                店主名称
masterPhone               店主手机
appKey                    店铺唯一ID，推荐使用sha1，md5,uuid生成的长序列
authorizerAppid           authorize_appid 小程序appid
authorizerStatus          关联状态
wxliteTemplateId          小程序模板编号
```

剩下则通过

环境变量 URL_PUT_AUTHORIZE 更新授权状态

put 请求
```
{
  "authorizer_appid": "cjnw4rv3j2mcn5432918uxn",
  "status" : 1/0
}
```

消息队列采用 rabbitmq

路由键分布:

wx 开头，代表微信触发的事件
hercules 开头，代表力士平台触发的事件

其中微信的事件有

```
wx.authorized 用户授权
wx.unauthorize 用户取消授权
wx.updateauthorize 用户更新授权
wx.component_verify_ticket 验证票据
wx.wxlite.audit_success 小程序审核成功
wx.wxlite.audit_fail 小程序审核失败

hercules.update_access_token 更新 component_access_token
hercules.update_access_token.success 更新 component_access_token 成功
hercules.wxlite.code_commit 微信小程序代码提交
hercules.wxlite.code_submit_audit 微信小程序代码提交审核
hercules.wxlite.code_release 微信小程序代码发布上线
```
