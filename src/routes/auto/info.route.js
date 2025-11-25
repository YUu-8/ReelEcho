/**
 * GET /info → merges two small helpers for easy unit testing.
 * Returns: { name, version, node, uptime }
 */
import express from 'express';
import packageInfo from '../../../package.json' with { type: 'json' };

const router = express.Router();

router.get('/info', (req, res) => {
  const responseData = {
    name: packageInfo.name,        
    version: packageInfo.version,  
    node: process.version,         
    uptime: process.uptime()       
  };
  res.status(200).json(responseData);
});

export default router;