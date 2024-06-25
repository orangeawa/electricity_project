import axios from "axios";
import fs from "fs";
import path from "path";
import schedule from "node-schedule";

// 定时获取数据
schedule.scheduleJob("0 *0 * * * *", () => {
  try {
    main();
  } catch (error) {
    console.error(error);
    setTimeout(main(), 1000 * 5);
  }
});


/**
 * 主函数
 */
async function main() {
  const t = new Date();
  const url = `./data/${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()}.json`;
  let rawData = await getData();

  const data = {
    time: t.getHours(),
    allE: rawData.map.showData["电表总用电量"],
    nowE: rawData.map.showData["当前剩余电量"],
  };

  // 保存数据到文件中
  saveData(url, data);
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

  // 使用axios发送POST请求并等待响应
  const response = await axios.post(url, payload, config);
  // 返回响应数据
  return response.data;
}

/**
 * 保存数据到指定的文件中。
 * @param {string} url 文件的路径。
 * @param {Object} data 需要保存的数据对象。
 */
function saveData(url, data) {
  const dirname = path.dirname(url); // 获取文件路径中的目录部分
  // 检查目录是否存在，如果不存在则创建目录
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  // 检查文件是否存在，如果不存在则初始化为空数组
  if (!fs.existsSync(url)) {
    fs.writeFileSync(url, JSON.stringify([], null, 2), "utf8");
  }

  // 读取并解析当前文件的数据，如果文件为空则默认为一个空数组
  let jsonData = JSON.parse(fs.readFileSync(url, "utf8"));

  // 将新数据添加到数组中
  jsonData.push(data);

  // 更新文件内容为新的数据数组
  fs.writeFileSync(url, JSON.stringify(jsonData, null, 2), "utf8");
}
