const exp = require('constants');
const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs'); //file system



//세션
app.use(session({
    secret: 'secret code',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 //쿠키 유효시간 1시간
    }
}));


app.use(express.json({
    limit: '50mb'
}));


//웹서버 띄우는 부분(첫번째파라미터:포트)
const server = app.listen(3000, () => {
    console.log('Server Started. port 3000')
});

let sql = require('./sql.js');

//sql.js파일에서 변경사항이 일어나는 것을 감지
//변경이 일어나면 기존의 sql.js캐시를 삭제하고 다시 sql.js를 정의
fs.watchFile(__dirname + '/sql.js', (curr, prev) => {
    console.log('sql변경시 재시작없이 반영되도록함')
    delete require.cache[require.resolve('./sql.js')];
    sql = require('./sql.js');
});


//DB연결 (db접속정보)

const db = {
    database: "dev",
    connectionLimit: 10,
    host: "192.168.0.2",
    user: "root",
    password: "mariadb"
};
//mysql 모듈 설치되어있어야 함 (위 db랑 연동)
const dbPool = require('mysql').createPool(db);


// 클라이언트에서 post방식으로 요청이 왔을때 아래 path에 따라 탄다.
app.post('/api/login', async (request, res) => {
    // request.session['email'] = 'seungwon.go@gmail.com';
    // res.send('ok');
    try {
      await req.db('signUp', request.body.param);
      if (request.body.param.length > 0) {
        for (let key in request.body.param[0]) request.session[key] = request.body.param[0][key];
        res.send(request.body.param[0]);
      } else {
        res.send({
          error: "Please try again or contact system manager."
        });
      }
    } catch (err) {
      res.send({
        error: "DB access error"
      });
    }
  });

app.post('/api/logout', async(request, res) => {
    request.session.destroy();
    res.send('ok');
});




//ex. /api/productList - 권한있는 사용자를 체크(로그인해야 접속가능)
app.post('/apirole/:alias', async(request, res) => {

    //권한체크 (email)
    if(!request.session.email) {
        return res.status(401).send({error:'You need to login.'})
    }

    try {
        res.send(await req.db(request.params.alias));
    }catch(err) {
        res.status(500).send({
            error: err
        });
    }
});

//ex. /api/productList - 로그인안해도 볼수있음
app.post('/api/:alias', async(request, res) => {
    try {
        res.send(await req.db(request.params.alias, request.body.param));
    }catch(err) {
        res.status(500).send({
            error: err
        });
    }
});



//sql[alias].query 는 sql.js의 sql[productList].query가 되는것

const req = { 
    async db(alias, param = [], where = '' ) {
        return new Promise((resolve, reject) => dbPool.query(sql[alias].query + where , param, (error, rows) => {
             if ( error ) {
                if ( error.code != 'ER_DUP_ENTRY')
                    console.log(error); 
                resolve({
                    error
                });
             } else resolve(rows);
        }));
     } 
};