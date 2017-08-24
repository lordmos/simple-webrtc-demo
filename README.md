# simple-webrtc-demo 一个简单的WebRTC演示程序

### 简化后的计划：

1. 简化登录流程，直接在应用主页面输入用户名，并且通知全部连接到WebSocket的用户。（上线通知）
2. 所有用户均可以呼叫其他在线用户。无法看到离线用户。
3. 用户token为时间戳。
4. 用户状态存在以下几种：在线、离线、通话连接中、通话中、通话结束中。
5. 用户登录后需通过系统WebSocket向系统注册在线信息，如果系统WebSocket断开，则用户离线。

### 整体流程：

1. 用户A获取摄像头和麦克风权限后才可以发起会话。
2. 用户A通过系统WebSocket向好友B发起通话请求，在线好友B客户端的系统WebSocket就会获取推送并处理通话请求。
3. 此时用户A的状态设置为通话连接中，而且不能发起或被邀请进入一个新的会话。
4. 在好友B通过通话请求邀请后，用户A通过getUserMedia()获取录制流，使用Simple-peer将流封装并生成一个P2P的peer，通过WebSocket递交给好友B。
5. 在建立完成前用户A和好友B的用户状态均改为通话中并通知给所有他们的好友，使其无法再次主叫或被叫。
6. 在双方任意一方结束这个会话时，或者在会话创建失败时，将根据用户的系统WebSocket在离线状态重新设置用户状态，并通知给他们的好友。

### 简化后的用户信息为：
    
    用户名、token、用户状态。

### 需要的准备：

    server: node / express + http + socket.io (for serve)
    client: app / ionic + simple-peer + socket.io-client (for client)
            webapp / angular + simple-peer + socket.io-client (for client)

### 资料：

* [Simple Peer](https://github.com/feross/simple-peer)
* [Socket IO](https://socket.io/)
* [WebRTC](https://webrtc.org/)
* [ionic Framework](http://ionicframework.com/)
* [Angular](http://angular.io/)

### 呼叫请求流程

                source                                                target

          发起请求(OFFERING)                --->                 在onOffering接收请求
                                                                        |
                                                          生成target peerId(offering peer)
                                                                        |
      在onConfirm收到target peerId         <---                   发送反馈(CONFIRM)
                  |
    将target peerId放入Source Peer中
                  |
     生成source peerId(answer peer)
                  |
      发送呼叫target请求(CALLING)           --->      在onConnecting中将source peerId放入Target Peer中
                  |                                                     |
            获取stream并播放                                        获取stream并播放

### 如何使用

**注意，请使用最新版本的Chrome**

#### webrtc-server

    npm i
    node index.js

#### webrtc-web

    ## angular-cli require
    npm i
    ng serve

#### webrtc-app

    ## ionic-cli require
    npm i
    ionic serve

**如果在局域网内多台设备之间进行调试，则可以将项目中`socket.service.ts`文件下`http://localhost:3000`替换成局域网内启动server设备的IP地址。**

**如：webrtc-server在`192.168.1.199`设备上启动，则将webrtc-web和webrtc-app工程中`socket.service.ts`文件下`http://localhost:3000`代码改为`http://192.168.1.199:3000`。**

### 已知问题

1. 旧版Safari不兼容。
2. Firefox存在Error: Ice connection failed. Exception。
3. 部署需要使用Https。
4. 存在ionic在Android手机上无法调起相机的Bug。
5. iOS的兼容性未知。
