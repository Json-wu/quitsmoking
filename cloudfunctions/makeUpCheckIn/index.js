// cloudfunctions/makeUpCheckIn/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { date } = event;

  try {
    // 验证日期
    if (!date) {
      return {
        success: false,
        message: '请选择补签日期'
      };
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 不能补签未来日期
    if (targetDate >= today) {
      return {
        success: false,
        message: '不能补签今天或未来日期'
      };
    }

    // 只能补签本月的日期
    if (targetDate.getMonth() !== today.getMonth() || 
        targetDate.getFullYear() !== today.getFullYear()) {
      return {
        success: false,
        message: '只能补签本月的日期'
      };
    }

    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data[0];

    // 检查补签次数
    const makeUpCount = user.makeUpCount || 0;
    if (makeUpCount === 0) {
      return {
        success: false,
        message: '本月补签次数已用完'
      };
    }

    // 检查是否已经签到过
    const checkinResult = await db.collection('checkins').where({
      _openid: wxContext.OPENID,
      date: date
    }).get();

    if (checkinResult.data.length > 0) {
      return {
        success: false,
        message: '该日期已签到，无需补签'
      };
    }

    // 计算补签日期的连续天数和累计天数
    // 1. 获取补签日期前一天的签到记录
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().slice(0, 10);
    
    const prevCheckinResult = await db.collection('checkins').where({
      _openid: wxContext.OPENID,
      date: prevDateStr
    }).get();

    let continuousDays = 1;

    if (prevCheckinResult.data.length > 0) {
      // 前一天有签到，连续天数+1
      continuousDays = prevCheckinResult.data[0].continuousDays + 1;
    } else {
      // 前一天没签到，连续天数重置为1
      continuousDays = 1;
    }

    // 累计天数 = 当前总签到记录数 + 1（包括本次补签）
    const { total } = await db.collection('checkins').where({
      _openid: wxContext.OPENID
    }).count();
    const totalDays = total + 1;

    // 创建补签记录
    await db.collection('checkins').add({
      data: {
        _openid: wxContext.OPENID,
        date: date,
        timestamp: targetDate.getTime(),
        isMakeUp: true,
        continuousDays,
        totalDays,
        createTime: db.serverDate()
      }
    });

    // 重新计算从补签日期开始的所有连续日期的连续天数
    // 获取补签日期及之后的所有签到记录（按日期升序）
    const allCheckinsFromTarget = await db.collection('checkins').where({
      _openid: wxContext.OPENID,
      timestamp: _.gte(targetDate.getTime())
    }).orderBy('timestamp', 'asc').get();

    // 从补签日期开始重新计算连续天数
    let currentContinuous = continuousDays;
    let lastDate = targetDate;

    for (let i = 1; i < allCheckinsFromTarget.data.length; i++) {
      const checkin = allCheckinsFromTarget.data[i];
      const checkinDate = new Date(checkin.date);
      const dayDiff = Math.floor((checkinDate - lastDate) / (24 * 60 * 60 * 1000));
      
      if (dayDiff === 1) {
        // 连续日期，重新计算连续天数
        currentContinuous++;
        
        await db.collection('checkins').doc(checkin._id).update({
          data: {
            continuousDays: currentContinuous
            // totalDays 不更新，保持原值
          }
        });
        
        lastDate = checkinDate;
      } else {
        // 不连续，停止更新
        break;
      }
    }

    // 更新用户补签次数（减1）
    await db.collection('users').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        makeUpCount: _.inc(-1),
        updateTime: db.serverDate()
      }
    });

    // 更新最后一条签到记录的累计天数
    // 获取当前最新的签到记录（按日期降序）
    const latestCheckinResult = await db.collection('checkins').where({
      _openid: wxContext.OPENID
    }).orderBy('date', 'desc').limit(1).get();

    if (latestCheckinResult.data.length > 0) {
      const latestCheckin = latestCheckinResult.data[0];
      currentContinuous = latestCheckin.continuousDays;
      // 重新计算总签到天数
      const { total: finalTotal } = await db.collection('checkins').where({
        _openid: wxContext.OPENID
      }).count();
      
      // 更新最新记录的totalDays
      await db.collection('checkins').doc(latestCheckin._id).update({
        data: {
          totalDays: finalTotal
        }
      });
    }

    return {
      success: true,
      message: '补签成功',
      remainingCount: makeUpCount - 1,
      continuousDays: currentContinuous,
      totalDays: totalDays
    };
  } catch (err) {
    console.error('补签失败:', err);
    return {
      success: false,
      message: '补签失败，请重试'
    };
  }
};
