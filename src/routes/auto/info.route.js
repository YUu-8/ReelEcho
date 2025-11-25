/**
 * GET /info → merges two small helpers for easy unit testing.
 * Returns: { name, version, node, uptime }
 */
import express from 'express';
// 关键：用 with { type: 'json' } 适配 Node.js v25.2.1
import packageInfo from '../../../package.json' with { type: 'json' };

const router = express.Router();

router.get('/info', (req, res) => {
  const responseData = {
    name: packageInfo.name,        // 从 package.json 读取应用名称
    version: packageInfo.version,  // 从 package.json 读取应用版本
    node: process.version,         // 获取 Node.js 版本
    uptime: process.uptime()       // 获取应用运行时长
  };
  res.status(200).json(responseData);
});

export default router; // ES Module 导出语法