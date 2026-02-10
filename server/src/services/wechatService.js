const axios = require('axios');
const { httpError } = require('../utils/errors');

async function code2Session(code) {
  const appid = process.env.WX_APPID;
  const secret = process.env.WX_SECRET;

  if (!appid || !secret) {
    throw httpError(500, 'Missing WX_APPID/WX_SECRET');
  }

  if (!code) {
    throw httpError(400, 'Missing code');
  }

  const url = 'https://api.weixin.qq.com/sns/jscode2session';

  const res = await axios.get(url, {
    params: {
      appid,
      secret,
      js_code: code,
      grant_type: 'authorization_code'
    },
    timeout: 8000
  });

  const data = res.data || {};
  if (data.errcode) {
    throw httpError(400, `code2session failed: ${data.errmsg || data.errcode}`);
  }

  if (!data.openid) {
    throw httpError(400, 'code2session failed: missing openid');
  }

  return {
    openid: data.openid,
    session_key: data.session_key,
    unionid: data.unionid
  };
}

module.exports = {
  code2Session
};
