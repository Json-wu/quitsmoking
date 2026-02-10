# quitsmoking server

## 环境变量

复制 `.env.example` 为 `.env`，然后修改：

- `PORT`：服务端口（默认 3000）
- `MONGODB_URI`：MongoDB 连接串
- `WX_APPID`：小程序 AppID（用于 code2session）
- `WX_SECRET`：小程序 AppSecret（用于 code2session）
- `JWT_SECRET`：JWT 签名密钥

## 本地运行

1. 安装依赖

```bash
npm i
```

2. 启动

```bash
npm run dev
```

## 鉴权

鉴权方式：小程序端 `wx.login` 拿到 `code`，服务端调用微信 `code2session` 换取 `openid`，然后签发 JWT。

1. 登录换 token

- `POST /auth/wxlogin`

body:

```json
{ "code": "wx.login返回的code", "userInfo": { "nickName": "", "avatarUrl": "" } }
```

返回：

```json
{ "success": true, "token": "...", "openid": "...", "makeUpCount": 3 }
```

2. 业务接口带 token

- 请求头：`Authorization: Bearer <token>`

## API

- `GET /health`

### 用户

- `GET /api/user/stats`

### 签到

- `POST /api/checkin`
- `POST /api/checkin/makeup`

body:

```json
{ "date": "YYYY-MM-DD" }
```

### 勋章

- `GET /api/badges`

### 电子烟

- `GET /api/cigarette/stats`
- `POST /api/cigarette/record`

body:

```json
{ "type": "puff|shake|light", "date": "YYYY-MM-DD" }
```
