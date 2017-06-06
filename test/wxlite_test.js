const wxOpenApi = require('../wxopenapi')

wxOpenApi.setDomain(
  { 
    accessToken: "d83qfABJ3MJmd6UjujhFNup9Q_mDew_bhIOogxtJ3o8ZVFeZTTJpwNHW9IrwMPjSWCImIeAGmksBH1Ie8QsbBo8L6V6tRpcI7CM5ps58qLeIlQK1GAgjGJQ8Rs_Dt07TJYXcADDZON",
    requestDomains: ['https://api.menuxx.com']
  })
.then(function (res) {
  console.log(res)
})