// CloudBase Web Function (HTTP) 格式
// 入口: index.main
exports.main = async (event, context) => {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({ success: true, message: 'pong', time: new Date().toISOString() })
  };
};
