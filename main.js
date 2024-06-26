import axios from "axios";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";

// 程序启动日志
log("程序启动!");

// 定时获取数据
schedule.scheduleJob("0 0 * * * *", () => {
  try {
    main();
  } catch (error) {
    log(`定时任务错误: ${error.message}`);
    setTimeout(() => main(), 1000 * 5);
  }
});

/**
 * 主函数
 */
async function main() {
  try {
    const t = new Date();
    const url = `./data/${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()}.json`;
    let rawData = await getData();

    // let rawData = {
    //   msg: 'success',
    //   code: 200,
    //   map: {
    //     showData: { '电表总用电量': 'test', '当前剩余电量': '21.08' },
    //     data: {
    //       campus: '江西环境工程职业学院',
    //       tsmAbstract: '校区#江西环境工程职业学院;楼栋#16栋;房间#16-205空调',
    //       campusid: '1sh',
    //       yktmercacc: '1000002',
    //       remark: '{"电表总用电量":"4859.35","当前剩余电量":"21.08"}',
    //       sroomid: 934,
    //       building: '16栋',
    //       roomid: '11841',
    //       room: '16-205空调',
    //       buildingid: '71'
    //     },
    //     dataType: 'IEC',
    //     surplusCharge: '21.08'
    //   }
    // }

    const data = {
      timeH: t.getHours(),
      timeM: t.getMinutes(),
      allE: rawData.map.showData["电表总用电量"],
      nowE: rawData.map.showData["当前剩余电量"],
    };

    // 保存数据到文件中
    saveData(url, data);
    log(`:数据写入成功`);
  } catch (error) {
    log(`主函数错误: ${error.message}`);
  }
}

/**
 * 获取特定费用数据的异步函数。
 * 该函数通过向指定URL发送POST请求，携带特定的请求体参数和头部信息，来获取费用数据。
 * @returns {Promise<void>} 返回一个Promise，解析时包含从服务器获取的数据。
 */
async function getData() {
  const url = "http://czfw.jxhjxy.com/charge/feeitem/getThirdData"; // 目标URL
  const payload = {
    campus: "1sh", // 校区代码
    building: "71", // 楼宇代码
    room: "11841", // 室号
    type: "IEC", // 类型
    level: "3", // 等级
    feeitemid: "408", // 费用项目ID
  };
  const config = {
    headers: {
      // 请求头配置
      "Content-Type": "application/x-www-form-urlencoded", // 指定请求体的数据类型为URL编码格式
      Authorization: "Basic Y2hhcmdlOmNoYXJnZV9zZWNyZXQ=", // 使用Basic认证，认证信息经过Base64编码
      "synjones-auth":
        "bearer eyJ0eXAiOiJKc29uV2ViVG9rZW4iLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJpc3N1c2VyIiwiYXVkIjoiYXVkaWVuY2UiLCJzbm8iOiIyMDIxODU1MyIsIm5hbWUiOiLpmYjmgZLlv5ciLCJpZCI6MTM1NSwibG9naW5Gcm9tIjoid2VjaGF0LXdvcmsiLCJ1dWlkIjoiMjkyOGVhZTZhYjNiZmIwMDc2MzY4YjY3YmQzNjhiNmIiLCJhY2NvdW50IjoiMjAyMTg1NTMifQ.YTs1eGLDYNdpZydwopg1m-ZpewnmGjVdplpnmlm2FVU", // 指定使用的认证令牌类型为Bearer，并提供令牌值
    },
  };

  try {
    const response = await axios.post(url, payload, config);
    return response.data;
  } catch (error) {
    log(`获取数据错误: ${error.message}`);
    throw error;
  }
}

/**
 * 保存数据到指定的文件中。
 * @param {string} url 文件的路径。
 * @param {Object} data 需要保存的数据对象。
 */
function saveData(url, data) {
  const dirname = path.dirname(url);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }

  let jsonData = [];
  if (fs.existsSync(url)) {
    jsonData = JSON.parse(fs.readFileSync(url, "utf8"));
  }

  jsonData.push(data);

  fs.writeFileSync(url, JSON.stringify(jsonData, null, 2), "utf8", (err) => {
    if (err) {
      log(`保存数据错误: ${err.message}`);
    }
  });
}

// 确保在程序结束时执行的操作
function shutdownGracefully(msg) {
  log(msg);
  process.exit(0);
}
 
// 监听程序退出事件
process.on('exit', () => shutdownGracefully('程序正常关闭\n'));
 
// 监听 Ctrl+C 信号
process.on('SIGINT', () => shutdownGracefully('程序通过 Ctrl+C 关闭'));
 
// 监听系统终止信号
process.on('SIGTERM', () => shutdownGracefully('程序通过系统信号关闭'));

/**
 * 记录日志
 * @param {string} message 日志信息
 */
function log(message) {
  const t = new Date();
  const logMessage = `[${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}] ${message}\n`;
  fs.appendFileSync(".log", logMessage, "utf8");
}