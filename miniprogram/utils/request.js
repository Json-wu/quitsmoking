// utils/request.js - 云函数请求封装

/**
 * 调用云函数
 * @param {String} name - 云函数名称
 * @param {Object} data - 请求数据
 * @returns {Promise} 云函数返回结果
 */
const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        if (res.result) {
          resolve(res.result);
        } else {
          reject(new Error('云函数返回数据格式错误'));
        }
      },
      fail: (err) => {
        console.error(`云函数${name}调用失败:`, err);
        reject(err);
      }
    });
  });
};

/**
 * 云数据库查询
 * @param {String} collection - 集合名称
 * @param {Object} where - 查询条件
 * @param {Object} options - 查询选项
 * @returns {Promise} 查询结果
 */
const dbQuery = (collection, where = {}, options = {}) => {
  const db = wx.cloud.database();
  let query = db.collection(collection).where(where);

  // 排序
  if (options.orderBy) {
    query = query.orderBy(options.orderBy.field, options.orderBy.order || 'asc');
  }

  // 限制数量
  if (options.limit) {
    query = query.limit(options.limit);
  }

  // 跳过
  if (options.skip) {
    query = query.skip(options.skip);
  }

  // 字段过滤
  if (options.field) {
    query = query.field(options.field);
  }

  return new Promise((resolve, reject) => {
    query.get({
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
};

/**
 * 云数据库添加
 * @param {String} collection - 集合名称
 * @param {Object} data - 数据
 * @returns {Promise} 添加结果
 */
const dbAdd = (collection, data) => {
  const db = wx.cloud.database();
  return new Promise((resolve, reject) => {
    db.collection(collection).add({
      data,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 云数据库更新
 * @param {String} collection - 集合名称
 * @param {Object} where - 查询条件
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新结果
 */
const dbUpdate = (collection, where, data) => {
  const db = wx.cloud.database();
  return new Promise((resolve, reject) => {
    db.collection(collection).where(where).update({
      data,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 云数据库删除
 * @param {String} collection - 集合名称
 * @param {Object} where - 查询条件
 * @returns {Promise} 删除结果
 */
const dbRemove = (collection, where) => {
  const db = wx.cloud.database();
  return new Promise((resolve, reject) => {
    db.collection(collection).where(where).remove({
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 云数据库统计
 * @param {String} collection - 集合名称
 * @param {Object} where - 查询条件
 * @returns {Promise} 统计结果
 */
const dbCount = (collection, where = {}) => {
  const db = wx.cloud.database();
  return new Promise((resolve, reject) => {
    db.collection(collection).where(where).count({
      success: (res) => resolve(res.total),
      fail: reject
    });
  });
};

/**
 * 上传文件到云存储
 * @param {String} cloudPath - 云存储路径
 * @param {String} filePath - 本地文件路径
 * @returns {Promise} 上传结果
 */
const uploadFile = (cloudPath, filePath) => {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 下载云存储文件
 * @param {String} fileID - 云文件ID
 * @returns {Promise} 下载结果
 */
const downloadFile = (fileID) => {
  return new Promise((resolve, reject) => {
    wx.cloud.downloadFile({
      fileID,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 删除云存储文件
 * @param {Array} fileList - 云文件ID数组
 * @returns {Promise} 删除结果
 */
const deleteFile = (fileList) => {
  return new Promise((resolve, reject) => {
    wx.cloud.deleteFile({
      fileList,
      success: resolve,
      fail: reject
    });
  });
};

/**
 * 获取临时文件链接
 * @param {Array} fileList - 云文件ID数组
 * @returns {Promise} 临时链接
 */
const getTempFileURL = (fileList) => {
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList,
      success: resolve,
      fail: reject
    });
  });
};

module.exports = {
  callFunction,
  dbQuery,
  dbAdd,
  dbUpdate,
  dbRemove,
  dbCount,
  uploadFile,
  downloadFile,
  deleteFile,
  getTempFileURL
};
