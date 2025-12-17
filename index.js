// ==============================
// 기본 모듈
// ==============================
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());

// ==============================
// 🔐 Discord 토큰
// ==============================
// Railway: 환경변수 사용
// 로컬 테스트: LOCAL_DISCORD_TOKEN 사용
const LOCAL_DISCORD_TOKEN = ""; // ← 로컬 테스트 시 여기에 토큰
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
  // 📢 공지 (가장 먼저 처리)
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

    return msg.reply("📢 공지가 Roblox 서버로 전송되었습니다.");
  }

  // ==========================
  // 나머지 명령어
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
  }
  else if (cmd === "!ban") {
    payload = { type: "ban", username, reason };
  }
  else if (cmd === "!unban") {
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Roblox API running on port ${PORT}`);
});

// ==============================
// Discord 봇 로그인
// ==============================
if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN이 없어 Discord 봇을 실행할 수 없습니다.");
  console.error("👉 로컬이면 LOCAL_DISCORD_TOKEN에 토큰을 넣으세요.");
} else {
  client.login(DISCORD_TOKEN);
}
