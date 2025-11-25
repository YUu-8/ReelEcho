// test/start.test.js

import { describe, it, vi, expect } from 'vitest';
import app from '../src/app.js'; 

// 模拟 app.listen 的调用，并确保它执行回调函数
vi.spyOn(app, 'listen').mockImplementation((port, callback) => {
    // 关键：手动执行 app.listen 传入的回调函数 (callback)
    if (callback) {
        callback();
    }
});

// 模拟 console.log，避免测试输出混乱
const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Application Startup', () => {
    it('should start the server and log the listening port (covering index.js)', async () => {
        
        // 导入 index.js 会触发 app.listen，
        // 随后我们修正后的 mock 会同步执行回调函数，触发 console.log
        await import('../src/index.js');
        
        // 检查 app.listen 是否被调用
        expect(app.listen).toHaveBeenCalled();
        
        // 检查 console.log 是否被调用，以覆盖日志语句
        // 这里使用 logSpy 来断言
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('listening on http://localhost'));
        
        // 清理 mock
        logSpy.mockRestore(); 
    });
});