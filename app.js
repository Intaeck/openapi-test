/**
 * JSON data와 apikey로 hskey 추출 
 */

// Express 기본 모듈 불러오기
const express = require('express')
  , http = require('http')
  , path = require('path');

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');
const request = require('request')
const crypto = require('crypto')
// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// 익스프레스 객체 생성
var app = express();

// 기본 속성 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())

app.use('/', static(path.join(__dirname, 'public')));

// bootstrap
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

//test 
app.get('/test', (req, res) => {
    var apikey = 'l7xx8d0a0a629f2e433686bb0b54da136abf'
    var jsondata = JSON.stringify(
        {
         "dataBody": {
             "ci": "CzKHU6afuRUXcaEj7Edgmrbj3eFG6rjPtteAPUIhGcr4NbYUKvIGzsUd6FvjjxAQo9sLNgxKQ4sWkj3GV/dGFQ1=="
        },
        "dataHeader": {}
    })

    console.log('jsondata ===> ', jsondata)
    var hmac = crypto.createHmac('sha256', apikey)
    var hsKey = hmac.update(jsondata).digest('base64')
    console.log('encoded_hmac ===> : ', hsKey)

    var reqPost = request({
        headers: {
            'apikey': apikey,
            'hsKey' : hsKey
        },
        method:'POST',
        //url: 'https://dev-openapi.kbstar.com:8443/land/getOfferList/ver1',
        url: 'https://dev-openapi.kbstar.com:8443/caq/getLiivTalkTalkAccountStatus/ver1',
        body: body,
        //json: true
        },
        function(error, response, body){
            if(!error && response.statusCode==200) {
                console.log(body);
                response.on('data', (data)=> {
                    console.log('data ===> ' ,data);
                })
                //res.send(body.statusCode)
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h1>hsKey 변환결과 입니다.</h1>');
                res.write('<div><p>hsKey : ' + hsKey + '</p></div>');
                //res.write('<div><p>' + body.bodyParser.data + '</p></div>')
                res.write("<br><br>");
                res.end();                
            }    
            else {
                res.status(403).json({
                    message: error.message
                })
                return
            }
        });
        //reqPost.end();
        reqPost.on('error', function(e) {
            console.error(e);
        })
})

// 라우터 사용하여 라우팅 함수 등록
var router = express.Router();

router.route('/trans').post(function(req, res) {
	console.log('/trans 처리함.');

	var paramId = req.body.apikey || req.query.apikey;
    var paramData = req.body.bodydata || req.query.bodydata;
 
    console.log('JSON data ===> : ', JSON.stringify(paramData))
    var hmac = crypto.createHmac('sha256', paramId)
    //var hmac = crypto.createHmac('sha256', new Buffer(appkey))
    var encoded_hmac = hmac.update(JSON.stringify(paramData)).digest('base64')
    
	res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
	res.write('<h1>hsKey 변환결과 입니다.</h1>');
	res.write('<div><p>hsKey : ' + encoded_hmac + '</p></div>');
	res.write("<br><br>");
	res.end();
});

// router.route('/test').post((req,res) => {

// })

app.use('/', router);


// 등록되지 않은 패스에 대해 페이지 오류 응답
app.all('*', function(req, res) {
	res.status(404).send('<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>');
});


// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
    static: {
      '404': './public/404.html'
    }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


// Express 서버 시작
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
