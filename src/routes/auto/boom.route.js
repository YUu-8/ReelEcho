/**
 * GET /boom → triggers an error to exercise the global error handler.
 */
import { Router } from "express";

const router = Router();

router.get("/boom", (_req, _res, next) => {
  // 1. 创建一个 Error 对象
  const err = new Error("Simulated 500 API Error triggered by /boom");
  
  // 2. (可选) 设置状态码，供错误处理器使用
  err.status = 500;
  
  // 3. 将错误传递给 Express 错误处理中间件
  next(err);
});

export default router;
