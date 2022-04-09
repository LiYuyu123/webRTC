'use strict'

let http = require('http');

let express = require('express');

let serverIndex = require('serve-index');

let app = express()

app.use(serverIndex('./dist'));
app.use(express.static('./dist'));


let http_server = http.createServer(app)
http_server.listen(3003);

let io = require('socket.io')(http_server, {
    path:'/rtcket'
});
http_server.on('listening',onListening);
const onListening = () =>{
    let addr = http_server.address();
    let bind = typeof  addr === 'string' ? 'pipe' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
};

//客户
let clients = []
io.on('connection',(socket)=>{
     let query = socket.handshake.query
     console.log(query)
     let { userName , room } = query
     console.log(userName + '连接了')
     //如果有同一个id就不做操作
     if(clients.some( i => i.userId === socket.id)) return
     socket.join(rom)
     clients.push( { userId: socket.id , userName})
     //过滤相同用户名
     if(clients.length >1){
         let hash = {}
         clients =  clients.reduce((item,next)=>{
             hahs[next.userName] ? '' : hash[next.userName] = true &&  item.push(next)
             return item
         },[])
         console.log('最终', clients)
     }
     if (clients.length >= 2) {
        io.sockets.in(room).emit('ready')
    }
     socket.emit('joined')
     socket.broadcast.to(room).emit('join',{userName})
     io.sockets.in(room).emit('clients',clients)
     //收到对等连接创建的消息
     socket.on('pc message',(data) => {
         socket.to(data.to.userId).emit('pc message',data)
         console.log('pc message收到对等连接创建的消息')
     })
     // 发私信,发起视频互动的请求
     socket.on('interact',(data) => {
         socket.to(data.to.userId).emit('interact', data)
         console.log('interact发起视频互动的请求')
     })
    // 对方同意视频互动
    socket.on('agree interact',  (data) =>{
        socket.to(data.from.userId).emit('agree interact', data)
        console.log('agree interact对方同意视频互动')
    })
    // 对方拒绝视频互动
    socket.on('refuse interact', (data) => {
        socket.to(data.from.userId).emit('refuse interact', data)
        console.log('拒绝视频互动的请求')
    })
    // 对方停止视频互动
    socket.on('stop interact',  (data) => {
        socket.to(data.to.userId).emit('stop interact', data)
        console.log('停止视频互动')
    })
    socket.on('leave', () => {
        socket.emit('left')
        socket.broadcast.to(room).emit('leave', {userId: socket.id, username})
        clients = clients.filter( i => i.userId !== socket.id)
        io.sockets.in(room).emit('clients',clients)
    })
    // 断开连接了
    socket.on('disconnect',()=>{
        console.log(username + '断开连接了')
        const obj = clients.filter(i => i.userId === socket.id)
        socket.broadcast.to(room).emit('close_disconnect', obj)
        console.log(room + 'close_disconnect', obj)
        clients = clients.filter(i => i.userId !== socket.id)
        io.sockets.in(room).emit('clients', clients)
        console.log(username + '最终断开连接了')
    })
})