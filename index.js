// ==============================
// 기본 모듈
// ==============================
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());

// ==============================
// 🔐 Discord 토큰 (로컬)
// ==============================
const LOCAL_DISCORD_TOKEN = "여기에_로컬_디스코드_봇_토큰";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || LOCAL_DISCORD_TOKEN;

// ==============================
// 명령 큐 (Roblox로 전달)
// ==============================
let commandQueue = [];

// ==============================
// Discord 봇 설정
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==============================
// Discord 메시지 명령 처리
// ==============================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith("!")) return;

  const content = msg.content.trim();

  // ==========================
  // 📢 공지
  // ==========================
  if (content.startsWith("!공지")) {
    const message = content.replace("!공지", "").trim();

    if (!message) {
      return msg.reply("❌ 공지 내용을 입력하세요.");
    }

    commandQueue.push({
      type: "announce",
      message
    });

    return msg.reply("📢 공지를 Roblox로 전송했습니다.");
  }

  // ==========================
  // ☢️ 핵폭탄 (10초 카운트는 Roblox에서)
  // ==========================
  if (content === "!핵폭탄") {
    commandQueue.push({
      type: "nuke"
    });

    return msg.reply("☢️ 핵폭탄 카운트다운을 시작했습니다. (10초)");
  }

  // ==========================
  // 킥 / 밴 / 언밴
  // ==========================
  const args = content.split(" ");
  const cmd = args.shift();
  const username = args.shift();
  const reason = args.join(" ") || "사유 없음";

  if (!username) {
    return msg.reply("❌ Roblox 사용자 이름을 입력하세요.");
  }

  let payload = null;

  if (cmd === "!kick") {
    payload = { type: "kick", username, reason };
  } else if (cmd === "!ban") {
    payload = { type: "ban", username, reason };
  } else if (cmd === "!unban") {
    payload = { type: "unban", username };
  }

  if (!payload) return;

  commandQueue.push(payload);
  msg.reply(`✅ 명령 등록됨: ${cmd} ${username}`);
});

// ==============================
// Discord 로그인 완료
// ==============================
client.once("clientReady", () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

// ==============================
// Roblox → 명령 요청 API
// ==============================
app.get("/roblox", (req, res) => {
  if (commandQueue.length === 0) {
    return res.json({ type: "none" });
  }

  const cmd = commandQueue.shift();
  res.json(cmd);
});

// ==============================
// 서버 실행
// ==============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Roblox API running on port ${PORT}`);
});

// ==============================
// Discord 봇 로그인
// ==============================
if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN이 없습니다.");
} else {
  client.login(DISCORD_TOKEN);
}
