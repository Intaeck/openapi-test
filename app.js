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
const ejs = require('ejs')
const request = require('request')
const crypto = require('crypto')
// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// 익스프레스 객체 생성
var app = express();

// 기본 속성 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: true }))
// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())
// /public 직접접근경로 설정 -> / = /public/
app.use('/', static(path.join(__dirname, 'public')));
//app.use('/public', static(path.join(__dirname, 'public')));

// bootstrap
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.set('view engine','ejs');
app.set('views',__dirname + '/views');

// open-api test 
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
        body: jsondata,
        //json: true
        },
        function(error, response, body){
            if(!error && response.statusCode == 200) {
                console.log('JITKB ===> : ', body);
                // response.on('data', (data)=> {
                //     console.log('data ===> ' ,data);
                // })
                //res.send(body.statusCode)
                //var resdata = JSON.stringify(JSON.parse(String(body).replace(/\s/g,"").replace(/\n/g, "\\n").replace(/\r/g, "\\r")))
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h1>hsKey 변환결과 입니다.</h1><br>');
                res.write('<div><p>hsKey : ' + hsKey + '</p></div><hr>');                
                res.write('<h1>OPEN API 응답결과 입니다.</h1><br>');
                res.write('<div><p>' + body + '</p></div>')
                //res.json(body)
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

router.route('/ejs').post((req, res) => {
    console.log('ejs 처리함', req.url)
    var paramId = req.body.apikey || req.query.apikey;
    var paramData = req.body.bodydata || req.query.bodydata;
    
    //입력값 검증
    try {
        var bodydata = JSON.parse(String(paramData).replace(/\s/g,"").replace(/\n/g, "\\n").replace(/\r/g, "\\r"))
    } catch (error) {
        res.status(400).send("<head> <link rel='stylesheet' href='/css/bootstrap.min.css'> </head>" + 
            "<h1>ERROR - JSON 형식 오류 입니다.</h1><br><br><a href='/index.html'>돌아가기</a>")
    }
    //JSON data 공백제거 
   
    console.log('apikey ===> : ', String(paramId))
    console.log('JSON data ===> : ', JSON.stringify(bodydata))

    var hmac = crypto.createHmac('sha256', String(paramId))
    //var hmac = crypto.createHmac('sha256', new Buffer(appkey))
    var encoded_hmac = hmac.update(JSON.stringify(bodydata)).digest('base64')

    res.render('trans', {apikey:paramId, bodydata:bodydata, data: encoded_hmac})
    // req.app.render('trans', encoded_hmac, function(err, html) {
    //     res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});

    //     if (err) {
    //         console.log('view rendering error')
    //     }
    //     console.log('rendered: ' + html)
    //     res.end(html)
    // })
})

router.route('/trans').post(function(req, res) {
	console.log('/trans 처리함.');
 
	var paramId = req.body.apikey || req.query.apikey;
    var paramData = req.body.bodydata || req.query.bodydata;

    //JSON data 공백제거 
    var bodydata = JSON.parse(String(paramData).replace(/\s/g,"").replace(/\n/g, "\\n").replace(/\r/g, "\\r"))
    console.log('apikey ===> : ', String(paramId))
    console.log('JSON data ===> : ', JSON.stringify(bodydata))

    var hmac = crypto.createHmac('sha256', String(paramId))
    //var hmac = crypto.createHmac('sha256', new Buffer(appkey))
    var encoded_hmac = hmac.update(JSON.stringify(bodydata)).digest('base64')
    // var encoded = hmac.update(JSON.stringify(bodydata))
    // var encoded_hmac = encoded.digest('base64')
    console.log('encoded : ' , encoded)
    console.log('encoded_hmac : ', encoded_hmac)
    
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
// app.all('*', function(req, res) {
//     console.log('app.all : ' , req.url)
// 	res.status(404).send('<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>');
// });


// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
    static: {
      '404': './public/404.html'
    }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


// Express 서버 시작
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
